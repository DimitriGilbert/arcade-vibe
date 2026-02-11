"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { ThemeHeader } from "@/components/arcade/theme-header";
import { GameCard } from "@/components/arcade/game-card";
import { LoadingState, EmptyState } from "@/components/reusable";

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

type SortOption = "recent" | "popular" | "score";
type ThemeStatus = "current" | "archived";

export default function ArcadePage() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("current");
  const [themeStatus, setThemeStatus] = useState<ThemeStatus>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

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

  // Fetch games for the selected theme
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games", selectedThemeId, themeStatus],
    queryFn: async () => {
      if (!selectedThemeId || selectedThemeId === "current") {
        // Try to get current theme's games
        try {
          const currentTheme = await trpcClient.themes.getCurrent.query();
          return await trpcClient.games.listByTheme.query({
            themeId: currentTheme.id,
            includeSubmitted: true,
            limit: 100,
          });
        } catch {
          // If no current theme, return empty
          return [];
        }
      } else {
        // Get games for selected theme
        return await trpcClient.games.listByTheme.query({
          themeId: selectedThemeId,
          includeSubmitted: true,
          limit: 100,
        });
      }
    },
    enabled: !!themes,
  });

  // Filter games based on search query
  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (!searchQuery.trim()) return games;

    const query = searchQuery.toLowerCase();
    return games.filter((game) => {
      const creatorName = game.prompt.user.name?.toLowerCase() || "";
      const creatorEmail = game.prompt.user.email.toLowerCase();
      return creatorName.includes(query) || creatorEmail.includes(query);
    });
  }, [games, searchQuery]);

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
        // Sort by model tier (higher tier first) as a proxy for quality
        const tierOrder: Record<string, number> = {
          cheater: 5,
          impossible: 4,
          hard: 3,
          normal: 2,
          easy: 1,
        };
        return gamesToSort.sort((a, b) => {
          const tierA = a.tierCost?.slug ?? "unknown";
          const tierB = b.tierCost?.slug ?? "unknown";
          return (tierOrder[tierB] ?? 0) - (tierOrder[tierA] ?? 0);
        });
      }

      default:
        return gamesToSort;
    }
  }, [filteredGames, sortOption]);

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
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <ArcadeInput
                  placeholder="Search by creator..."
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
              <GameCard
                key={game.id}
                game={game}
                onClick={() => {
                  window.location.href = `/game/${game.id}`;
                }}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {sortedGames.length > 0 && (
          <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            Showing {sortedGames.length}{" "}
            {sortedGames.length === 1 ? "game" : "games"}
          </div>
        )}
      </div>
    </div>
  );
}
