"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import {
  Swords,
  Trophy,
  Star,
  RefreshCw,
  Loader2,
  User,
  Play,
  Cpu,
  Calendar,
  Crown,
  Flame,
  Sparkles,
} from "lucide-react";
import type { RouterOutput } from "@/lib/trpc-types";

type LeaderboardEntry = NonNullable<RouterOutput["leaderboard"]["getTop"]>["entries"][number];

const PAGE_SIZE = 50;

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

function ChampionSkeleton() {
  return (
    <div className="animate-pulse text-center py-12">
      <div className="w-24 h-24 mx-auto bg-[var(--muted)] rounded-full mb-4" />
      <div className="h-8 w-48 mx-auto bg-[var(--muted)] rounded mb-2" />
      <div className="h-4 w-32 mx-auto bg-[var(--muted)] rounded" />
    </div>
  );
}

export default function ArenaClient() {
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
    queryKey: ["themes-arena"],
    queryFn: async () => {
      return await trpcClient.themes.list.query();
    },
  });

  const currentTheme = useMemo(() => {
    if (!themes) return null;
    return themes.find((t) => t.status === "active");
  }, [themes]);

  const { isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard-arena", currentTheme?.id],
    queryFn: async () => {
      const result = await trpcClient.leaderboard.getTop.query({
        themeId: currentTheme?.id,
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

    setIsLoadingMore(true);
    try {
      const result = await trpcClient.leaderboard.getTop.query({
        themeId: currentTheme?.id,
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
  }, [cursor, hasMore, isLoadingMore, currentTheme?.id]);

  const champion = allEntries[0];
  const challengers = allEntries.slice(1);
  const isLoading = themesLoading || leaderboardLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Swords className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
                THE ARENA
              </h1>
              <p className="text-[var(--muted-foreground)] font-medium">
                Who&apos;s holding it down today?
              </p>
            </div>
          </div>
        </div>

        {currentTheme && (
          <ArcadeCard className="mb-6 overflow-hidden" variant="glow">
            <div className="p-4 bg-gradient-to-r from-[var(--primary)]/10 via-[var(--accent)]/10 to-[var(--primary)]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--primary)]/20 rounded-lg">
                    <Flame className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-lg">{currentTheme.title}</h2>
                      <ArcadeBadge text="Live" variant="neon" icon={<Sparkles className="h-3 w-3" />} />
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {currentTheme.description || "Jump in and make your mark!"}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <span>{allEntries.length} players in the ring</span>
                </div>
              </div>
            </div>
          </ArcadeCard>
        )}

        {themesError && (
          <ArcadeCard className="mb-6 border-destructive/50 bg-destructive/5">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-destructive">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Couldn&apos;t load the arena data. Let&apos;s try again.
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

        {isLoading ? (
          <div className="space-y-6">
            <ArcadeCard>
              <ChampionSkeleton />
            </ArcadeCard>
          </div>
        ) : allEntries.length === 0 ? (
          <ArcadeCard>
            <div className="p-20">
              <EmptyState
                variant="card"
                icon={<Swords className="h-16 w-16 opacity-50" />}
                title="The arena is quiet..."
                message={
                  currentTheme
                    ? `No one's stepped up for ${currentTheme.title} yet. Be the first!`
                    : "Waiting for contenders. Pick a theme and get in there!"
                }
              />
            </div>
          </ArcadeCard>
        ) : (
          <div className="space-y-6">
            {champion && (
              <ArcadeCard variant="glow" className="overflow-hidden">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-full border border-amber-500/30 mb-4">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Center Stage
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/30 mb-4">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>

                    <Link
                      href={`/game/${champion.gameId}`}
                      className="block text-2xl font-black text-[var(--foreground)] hover:text-[var(--primary)] transition-colors mb-2"
                    >
                      {champion.gameName || "Untitled Game"}
                    </Link>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <User className="h-4 w-4 text-[var(--muted-foreground)]" />
                      {champion.creator?.name ? (
                        <Link
                          href={`/profile/${champion.creator.name}`}
                          className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors font-medium"
                        >
                          {champion.creator.name}
                        </Link>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">Anonymous</span>
                      )}
                      {champion.tier && (
                        <ArcadeBadge text={champion.tier.slug} variant="default" className="ml-2" />
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1 px-6 py-3 bg-[var(--primary)]/10 rounded-xl mb-4">
                      <Star className="h-6 w-6 text-[var(--primary)]" />
                      <span className="text-3xl font-black text-[var(--primary)]">
                        {formatScore(champion.finalScore)}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)] ml-1">pts</span>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-sm text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{champion.modelName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(champion.submittedAt ?? champion.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link href={`/game/${champion.gameId}`}>
                        <ArcadeButton variant="primary" size="lg" className="gap-2">
                          <Play className="h-5 w-5" />
                          Play This Game
                        </ArcadeButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </ArcadeCard>
            )}

            {challengers.length > 0 && (
              <ArcadeCard>
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-[var(--accent)]" />
                    <h2 className="text-lg font-bold">Challengers</h2>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      ({challengers.length} in the ring)
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {challengers.map((entry, index) => {
                    const rank = index + 2;
                    const isPodium = rank <= 3;

                    return (
                      <div
                        key={entry.gameId}
                        className={`flex items-center gap-4 p-4 hover:bg-[var(--muted)]/30 transition-colors group ${
                          isPodium ? "bg-[var(--accent)]/5" : ""
                        }`}
                      >
                        <div className="w-12 flex-shrink-0 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              rank === 2
                                ? "bg-slate-400/20 text-slate-600 dark:text-slate-300"
                                : rank === 3
                                  ? "bg-amber-700/20 text-amber-700 dark:text-amber-500"
                                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                            }`}
                          >
                            {rank}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/game/${entry.gameId}`}
                              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
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
                              <span className="truncate max-w-[100px]">{entry.modelName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-lg text-[var(--foreground)] font-mono">
                              {formatScore(entry.finalScore)}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">pts</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
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
                          <Swords className="h-4 w-4" />
                          See More Challengers
                        </>
                      )}
                    </ArcadeButton>
                  </div>
                )}
              </ArcadeCard>
            )}

            <div className="text-center text-sm text-[var(--muted-foreground)]">
              {allEntries.length} {allEntries.length === 1 ? "player" : "players"} in the arena
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
