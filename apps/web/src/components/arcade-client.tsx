"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton, ArcadeInput, ArcadeBadge } from "@/components/arcade";
import {
  Search,
  Trophy,
  Clock,
  Star,
  RefreshCw,
  Loader2,
  ChevronDown,
  User,
  Play,
  Cpu,
  Calendar,
} from "lucide-react";
import { ThemeHeader } from "@/components/arcade/theme-header";
import { EmptyState } from "@/components/reusable";
import type { RouterOutput } from "@/lib/trpc-types";

type LeaderboardEntry = NonNullable<RouterOutput["leaderboard"]["getTop"]>["entries"][number];
type ThemeStatus = "current" | "archived";
type SortOption = "score" | "recent";

const PAGE_SIZE = 50;

const skeletonIds = Array.from({ length: 10 }, (_, i) => `skeleton-${i}`);

function LeaderboardSkeleton() {
  return (
    <div className="animate-pulse">
      {skeletonIds.map((id) => (
        <div key={id} className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
          <div className="w-12 h-8 bg-[var(--muted)] rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-[var(--muted)] rounded" />
            <div className="h-3 w-1/4 bg-[var(--muted)] rounded" />
          </div>
          <div className="w-20 h-6 bg-[var(--muted)] rounded" />
        </div>
      ))}
    </div>
  );
}

function formatScore(score: number | string): string {
  const num = typeof score === "string" ? parseFloat(score) : score;
  if (Number.isNaN(num) || num === 0) return "0";
  return num.toLocaleString();
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getRankBadge(rank: number) {
  if (rank === 1) return { bg: "bg-amber-500", text: "text-white", label: "1ST" };
  if (rank === 2) return { bg: "bg-slate-400", text: "text-white", label: "2ND" };
  if (rank === 3) return { bg: "bg-amber-700", text: "text-white", label: "3RD" };
  return null;
}

export default function ArcadePage() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("current");
  const [themeStatus, setThemeStatus] = useState<ThemeStatus>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("score");
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const getCurrentThemeId = useCallback((): string | undefined => {
    if (selectedThemeId && selectedThemeId !== "current") {
      return selectedThemeId;
    }
    const activeTheme = themes?.find((t) => t.status === "active");
    return activeTheme?.id;
  }, [selectedThemeId, themes]);

  const { isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard-initial", selectedThemeId],
    queryFn: async () => {
      const themeId = getCurrentThemeId();
      
      const result = await trpcClient.leaderboard.getTop.query({
        themeId,
        limit: PAGE_SIZE,
      });

      if (result) {
        setAllEntries(result.entries as LeaderboardEntry[]);
        setCursor(result.nextCursor ?? undefined);
        setHasMore(result.hasMore);
      } else {
        setAllEntries([]);
        setHasMore(false);
      }

      return result;
    },
    enabled: !!themes,
  });

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const themeId = getCurrentThemeId();

    setIsLoadingMore(true);
    try {
      const result = await trpcClient.leaderboard.getTop.query({
        themeId,
        limit: PAGE_SIZE,
        cursor,
      });

      if (result) {
        setAllEntries((prev) => [...prev, ...(result.entries as LeaderboardEntry[])]);
        setCursor(result.nextCursor ?? undefined);
        setHasMore(result.hasMore);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, getCurrentThemeId]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return allEntries;

    const query = searchQuery.toLowerCase();
    return allEntries.filter((entry) => {
      const gameName = entry.gameName?.toLowerCase() ?? "";
      const userName = entry.creator?.name?.toLowerCase() ?? "";
      const modelName = entry.modelName?.toLowerCase() ?? "";
      return gameName.includes(query) || userName.includes(query) || modelName.includes(query);
    });
  }, [allEntries, searchQuery]);

  const sortedEntries = useMemo(() => {
    if (sortOption === "recent") {
      return [...filteredEntries].sort((a, b) => 
        new Date(b.submittedAt ?? b.createdAt).getTime() - new Date(a.submittedAt ?? a.createdAt).getTime()
      );
    }
    return filteredEntries;
  }, [filteredEntries, sortOption]);

  const currentTheme = useMemo(() => {
    if (!themes) return null;
    return themes.find((t) => t.status === "active");
  }, [themes]);

  const archivedThemes = useMemo(() => {
    if (!themes) return [];
    return themes.filter((t) => t.status === "archived");
  }, [themes]);

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
    setAllEntries([]);
    setCursor(undefined);
    setHasMore(true);
  };

  const isLoading = themesLoading || leaderboardLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
                LEADERBOARD
              </h1>
              <p className="text-[var(--muted-foreground)] font-medium">
                Top scores this theme
              </p>
            </div>
          </div>
        </div>

        <ThemeHeader
          currentTheme={currentTheme || null}
          archivedThemes={archivedThemes}
          selectedThemeId={selectedThemeId}
          themeStatus={themeStatus}
          onThemeSelect={handleThemeSelect}
          onThemeStatusChange={setThemeStatus}
          isLoading={themesLoading}
        />

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

        <ArcadeCard className="mb-6">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <ArcadeInput
                  placeholder="Search games, players, or models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <ArcadeButton
                  variant={sortOption === "score" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSortOption("score")}
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  Score
                </ArcadeButton>
                <ArcadeButton
                  variant={sortOption === "recent" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSortOption("recent")}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Recent
                </ArcadeButton>
              </div>
            </div>
          </div>

          {isLoading ? (
            <LeaderboardSkeleton />
          ) : sortedEntries.length === 0 ? (
            <div className="p-20">
              <EmptyState
                variant="card"
                icon={<Trophy className="h-16 w-16 opacity-50" />}
                title="No Games Yet"
                message={
                  selectedTheme
                    ? `No games submitted for ${selectedTheme.title}`
                    : "Select a theme to view games"
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {sortedEntries.map((entry, index) => {
                const rank = sortOption === "score" ? index + 1 : null;
                const badge = rank ? getRankBadge(rank) : null;

                return (
                  <div
                    key={entry.gameId}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/30 transition-colors group"
                  >
                    <div className="w-16 flex-shrink-0 text-center">
                      {badge ? (
                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-md font-black text-sm ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      ) : rank ? (
                        <span className="text-2xl font-bold text-[var(--muted-foreground)]">
                          {rank}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/game/${entry.gameId}`}
                          className="font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
                        >
                          {entry.gameName || "Untitled Game"}
                        </Link>
                        <Link
                          href={`/game/${entry.gameId}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="h-4 w-4 text-[var(--primary)]" />
                        </Link>
                        {entry.tier && (
                          <ArcadeBadge text={entry.tier.slug} variant="default" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.creator?.name ? (
                            <Link
                              href={`/profile/${entry.creator.name}`}
                              className="hover:text-[var(--primary)] transition-colors"
                            >
                              {entry.creator.name}
                            </Link>
                          ) : (
                            <span>Anonymous</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{entry.modelName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.submittedAt ?? entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-black text-xl text-[var(--foreground)] font-mono">
                          {formatScore(entry.finalScore)}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          pts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && !searchQuery && sortedEntries.length > 0 && (
            <div className="p-4 border-t border-[var(--border)]">
              <ArcadeButton
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load More
                  </>
                )}
              </ArcadeButton>
            </div>
          )}
        </ArcadeCard>

        {sortedEntries.length > 0 && (
          <div className="text-center text-sm text-[var(--muted-foreground)]">
            {sortedEntries.length} {sortedEntries.length === 1 ? "entry" : "entries"}
            {hasMore && !searchQuery && " - scroll for more"}
          </div>
        )}
      </div>
    </div>
  );
}
