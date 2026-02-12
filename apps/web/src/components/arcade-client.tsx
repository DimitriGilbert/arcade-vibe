"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton, ArcadeInput } from "@/components/arcade";
import {
  Search,
  Gamepad2,
  Clock,
  TrendingUp,
  Star,
  RefreshCw,
  Loader2,
  Filter,
} from "lucide-react";
import { ThemeHeader } from "@/components/arcade/theme-header";
import { GameCard } from "@/components/arcade/game-card";
import { LoadingState, EmptyState } from "@/components/reusable";
import type { RouterOutput } from "@/lib/trpc-types";

type GamesListResponse = RouterOutput["games"]["listByTheme"];
type Game = NonNullable<GamesListResponse>["games"][number];
type SortOption = "recent" | "popular" | "score";
type ThemeStatus = "current" | "archived";
type TierFilter = "all" | "easy" | "medium" | "hard" | "extreme";
type SubmissionFilter = "all" | "submitted" | "not-submitted";

const PAGE_SIZE = 20;

/**
 * Skeleton component for game cards during loading
 */
function GameCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Thumbnail skeleton */}
      <div className="aspect-video bg-[var(--muted)]"></div>
      {/* Content skeleton */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Title skeleton */}
          <div className="h-5 w-3/4 bg-[var(--muted)] rounded"></div>
          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-[var(--muted)] rounded"></div>
            <div className="h-3 w-2/3 bg-[var(--muted)] rounded"></div>
          </div>
        </div>
        {/* Meta info skeleton */}
        <div className="flex items-center gap-3 mt-4">
          <div className="h-3 w-20 bg-[var(--muted)] rounded"></div>
          <div className="h-3 w-16 bg-[var(--muted)] rounded"></div>
        </div>
      </div>
      {/* Button skeleton */}
      <div className="p-4 pt-0">
        <div className="h-10 w-full bg-[var(--muted)] rounded-lg"></div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards for loading state
 */
function GameCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <GameCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function ArcadePage() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("current");
  const [themeStatus, setThemeStatus] = useState<ThemeStatus>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  // Filter state
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [submissionFilter, setSubmissionFilter] =
    useState<SubmissionFilter>("all");
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  // Pagination state
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch all themes
  const {
    data: themes,
    isLoading: themesLoading,
    isError: themesError,
    refetch: refetchThemes,
  } = useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      return await trpcClient.themes.list.query();
    },
  });

  // Get current theme ID for queries
  const getCurrentThemeId = useCallback(async (): Promise<string | null> => {
    if (selectedThemeId && selectedThemeId !== "current") {
      return selectedThemeId;
    }
    try {
      const currentTheme = await trpcClient.themes.getCurrent.query();
      return currentTheme.id;
    } catch {
      return null;
    }
  }, [selectedThemeId]);

  // Fetch initial games for the selected theme
  const { isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["games-initial", selectedThemeId, themeStatus],
    queryFn: async () => {
      const themeId = await getCurrentThemeId();
      if (!themeId) {
        setAllGames([]);
        setHasMore(false);
        return { games: [], nextCursor: undefined, hasMore: false };
      }

      const result = await trpcClient.games.listByTheme.query({
        themeId,
        includeSubmitted: true,
        limit: PAGE_SIZE,
      });

      if (result) {
        setAllGames(result.games);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } else {
        setAllGames([]);
        setHasMore(false);
      }

      return result;
    },
    enabled: !!themes,
  });

  // Load more games
  const loadMoreGames = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const themeId = await getCurrentThemeId();
    if (!themeId) return;

    setIsLoadingMore(true);
    try {
      const result = await trpcClient.games.listByTheme.query({
        themeId,
        includeSubmitted: true,
        limit: PAGE_SIZE,
        cursor,
      });

      if (result) {
        setAllGames((prev) => [...prev, ...result.games]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, getCurrentThemeId]);

  // Fetch leaderboard data for score sorting
  const { data: leaderboardData } = useQuery({
    queryKey: ["leaderboard", selectedThemeId],
    queryFn: async () => {
      const themeId = await getCurrentThemeId();
      if (!themeId) return [];
      return await trpcClient.leaderboard.getTop.query({
        themeId,
        limit: 100,
      });
    },
    enabled: !!themes,
  });

  // Create score map from leaderboard data
  const scoreMap = useMemo(() => {
    if (!leaderboardData) return new Map<string, number>();
    const map = new Map<string, number>();
    leaderboardData.forEach((entry) => {
      if (entry.game?.id) {
        map.set(entry.game.id, Number(entry.finalScore));
      }
    });
    return map;
  }, [leaderboardData]);

  // Filter games based on search query and filter options
  const filteredGames = useMemo(() => {
    if (!allGames) return [];

    return allGames.filter((game) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const creatorName = game.prompt.user.name?.toLowerCase() || "";
        const creatorEmail = game.prompt.user.email.toLowerCase();
        const promptContent = game.prompt.content?.toLowerCase() || "";
        const themeTitle = game.theme?.title?.toLowerCase() || "";
        const modelName = game.modelName?.toLowerCase() || "";

        const matchesSearch =
          creatorName.includes(query) ||
          creatorEmail.includes(query) ||
          promptContent.includes(query) ||
          themeTitle.includes(query) ||
          modelName.includes(query);

        if (!matchesSearch) return false;
      }

      // Tier filter
      if (tierFilter !== "all") {
        const gameTier = game.tierCost?.slug ?? "unknown";
        if (gameTier !== tierFilter) return false;
      }

      // Submission status filter
      if (submissionFilter === "submitted" && !game.isSubmitted) return false;
      if (submissionFilter === "not-submitted" && game.isSubmitted)
        return false;

      // Minimum rating filter
      if (minRatingFilter > 0) {
        const gameScore = scoreMap.get(game.id) ?? 0;
        if (gameScore < minRatingFilter) return false;
      }

      return true;
    });
  }, [
    allGames,
    searchQuery,
    tierFilter,
    submissionFilter,
    minRatingFilter,
    scoreMap,
  ]);

  // Sort games based on sort option
  const sortedGames = useMemo(() => {
    const gamesToSort = [...filteredGames];

    switch (sortOption) {
      case "recent":
        return gamesToSort.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

      case "popular":
        // Sort by number of submissions or other popularity metrics
        // For now, use createdAt as a proxy for popularity (newer = more visible)
        return gamesToSort.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

      case "score": {
        // Sort by actual game scores from leaderboard
        // Games without scores appear at the end
        return gamesToSort.sort((a, b) => {
          const scoreA = scoreMap.get(a.id) ?? 0;
          const scoreB = scoreMap.get(b.id) ?? 0;
          return scoreB - scoreA;
        });
      }

      default:
        return gamesToSort;
    }
  }, [filteredGames, sortOption, scoreMap]);

  // Get current theme
  const currentTheme = useMemo(() => {
    if (!themes) return null;
    return themes.find((t) => t.status === "active");
  }, [themes]);

  // Get archived themes
  const archivedThemes = useMemo(() => {
    if (!themes) return [];
    return themes.filter((t) => t.status === "archived");
  }, [themes]);

  // Get selected theme object
  const selectedTheme = useMemo(() => {
    if (!themes) return null;
    if (selectedThemeId === "current") return currentTheme;
    return themes.find((t) => t.id === selectedThemeId);
  }, [themes, selectedThemeId, currentTheme]);

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    if (themeId === "current") {
      setThemeStatus("current");
    } else {
      setThemeStatus("archived");
    }
    // Reset pagination when theme changes
    setAllGames([]);
    setCursor(undefined);
    setHasMore(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[var(--primary)] rounded-xl">
              <Gamepad2 className="h-8 w-8 text-[var(--primary-foreground)]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[var(--foreground)]">
                Arcade
              </h1>
              <p className="text-[var(--muted-foreground)]">
                Discover and play AI-generated games
              </p>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <ThemeHeader
          currentTheme={currentTheme || null}
          archivedThemes={archivedThemes}
          selectedThemeId={selectedThemeId}
          themeStatus={themeStatus}
          onThemeSelect={handleThemeSelect}
          onThemeStatusChange={setThemeStatus}
          isLoading={themesLoading}
        />

        {/* Theme Loading Error with Retry */}
        {themesError && (
          <ArcadeCard className="mb-6 border-destructive/50 bg-destructive/5">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-destructive">
                    Failed to load themes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Unable to fetch theme data. Please try again.
                  </p>
                </div>
                <ArcadeButton
                  variant="outline"
                  onClick={() => refetchThemes()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </ArcadeButton>
              </div>
            </div>
          </ArcadeCard>
        )}

        {/* Filters and Search */}
        <ArcadeCard className="mb-6">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              {/* Search and Sort Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                  <ArcadeInput
                    placeholder="Search by creator, prompt, theme, or model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sort Options */}
                <div className="flex gap-2">
                  <ArcadeButton
                    variant={sortOption === "recent" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSortOption("recent")}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Recent
                  </ArcadeButton>
                  <ArcadeButton
                    variant={sortOption === "popular" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSortOption("popular")}
                    className="gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Popular
                  </ArcadeButton>
                  <ArcadeButton
                    variant={sortOption === "score" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSortOption("score")}
                    className="gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Score
                  </ArcadeButton>
                </div>
              </div>

              {/* Filter Dropdowns Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Filter className="h-4 w-4" />
                  <span>Filters:</span>
                </div>

                {/* Difficulty Tier Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--muted-foreground)]">
                    Difficulty
                  </label>
                  <select
                    value={tierFilter}
                    onChange={(e) => {
                      setTierFilter(e.target.value as TierFilter);
                      // Reset pagination when filter changes
                      setAllGames([]);
                      setCursor(undefined);
                      setHasMore(true);
                    }}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="all">All Tiers</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>

                {/* Submission Status Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--muted-foreground)]">
                    Status
                  </label>
                  <select
                    value={submissionFilter}
                    onChange={(e) => {
                      setSubmissionFilter(e.target.value as SubmissionFilter);
                      // Reset pagination when filter changes
                      setAllGames([]);
                      setCursor(undefined);
                      setHasMore(true);
                    }}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="all">All Games</option>
                    <option value="submitted">Submitted</option>
                    <option value="not-submitted">Not Submitted</option>
                  </select>
                </div>

                {/* Minimum Rating Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--muted-foreground)]">
                    Min Score
                  </label>
                  <select
                    value={minRatingFilter}
                    onChange={(e) => {
                      setMinRatingFilter(Number(e.target.value));
                      // Reset pagination when filter changes
                      setAllGames([]);
                      setCursor(undefined);
                      setHasMore(true);
                    }}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value={0}>Any Score</option>
                    <option value={100}>100+</option>
                    <option value={500}>500+</option>
                    <option value={1000}>1,000+</option>
                    <option value={5000}>5,000+</option>
                    <option value={10000}>10,000+</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(tierFilter !== "all" ||
                  submissionFilter !== "all" ||
                  minRatingFilter > 0) && (
                  <ArcadeButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTierFilter("all");
                      setSubmissionFilter("all");
                      setMinRatingFilter(0);
                      // Reset pagination
                      setAllGames([]);
                      setCursor(undefined);
                      setHasMore(true);
                    }}
                    className="mt-4 sm:mt-0"
                  >
                    Clear Filters
                  </ArcadeButton>
                )}
              </div>
            </div>
          </div>
        </ArcadeCard>

        {/* Game Grid */}
        {gamesLoading ? (
          <GameCardSkeletonGrid count={8} />
        ) : sortedGames.length === 0 ? (
          <ArcadeCard>
            <div className="p-20">
              <EmptyState
                variant="card"
                icon={<Gamepad2 className="h-16 w-16 opacity-50" />}
                title="No Games Found"
                message={
                  selectedTheme
                    ? `No games available for ${selectedTheme.title}`
                    : "Select a theme to view available games"
                }
              />
            </div>
          </ArcadeCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {sortedGames.length > 0 &&
          hasMore &&
          !searchQuery &&
          tierFilter === "all" &&
          submissionFilter === "all" &&
          minRatingFilter === 0 && (
            <div className="mt-8 flex justify-center">
              <ArcadeButton
                variant="outline"
                onClick={loadMoreGames}
                disabled={isLoadingMore}
                className="min-w-[200px] gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Games"
                )}
              </ArcadeButton>
            </div>
          )}

        {/* Results Count */}
        {sortedGames.length > 0 && (
          <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            Showing {sortedGames.length}
            {hasMore &&
            !searchQuery &&
            tierFilter === "all" &&
            submissionFilter === "all" &&
            minRatingFilter === 0
              ? "+"
              : ""}{" "}
            {sortedGames.length === 1 ? "game" : "games"}
            {hasMore &&
              !searchQuery &&
              tierFilter === "all" &&
              submissionFilter === "all" &&
              minRatingFilter === 0 &&
              " - scroll down for more"}
          </div>
        )}
      </div>
    </div>
  );
}
