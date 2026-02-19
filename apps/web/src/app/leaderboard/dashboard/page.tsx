"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { trpcClient } from "@/utils/trpc";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeBadge,
  ArcadeStats,
} from "@/components/arcade";
import {
  Trophy,
  Clock,
  Cpu,
  Users,
  Gamepad2,
  ChevronDown,
  Loader2,
  Play,
  RefreshCw,
  Zap,
  TrendingUp,
} from "lucide-react";
import type { RouterOutput } from "@/lib/trpc-types";

type LeaderboardEntry = NonNullable<RouterOutput["leaderboard"]["getTop"]>["entries"][number];

const PAGE_SIZE = 30;

function formatTimeRemaining(endDate: Date | string | null): string {
  if (!endDate) return "Ongoing";
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m left`;
}

function formatScore(score: number | string): string {
  const num = typeof score === "string" ? parseFloat(score) : score;
  if (Number.isNaN(num) || num === 0) return "0";
  return num.toLocaleString();
}

function formatDateShort(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getRankStyle(rank: number) {
  if (rank === 1) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
  if (rank === 2) return "bg-slate-400/20 text-slate-500 border-slate-400/30";
  if (rank === 3) return "bg-amber-600/20 text-amber-600 border-amber-600/30";
  return "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]";
}

function DashboardHeader({
  theme,
  entriesCount,
  topModel,
}: {
  theme: { title: string; endDate: string | null } | null;
  entriesCount: number;
  topModel: string | null;
}) {
  const timeRemaining = theme?.endDate ? formatTimeRemaining(theme.endDate) : "Ongoing";

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <Trophy className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">
                {theme?.title ?? "All Games"}
              </h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                {entriesCount} entries • {timeRemaining}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {topModel && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--muted)]/50 rounded-lg text-xs">
                <Cpu className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span className="text-[var(--muted-foreground)]">Top model:</span>
                <span className="font-medium truncate max-w-[100px]">{topModel}</span>
              </div>
            )}
            <Link href="/login">
              <ArcadeButton variant="primary" size="sm" className="gap-1.5">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Play</span>
              </ArcadeButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStats({
  entries,
  uniquePlayers,
  topModel,
  timeRemaining,
}: {
  entries: number;
  uniquePlayers: number;
  topModel: string | null;
  timeRemaining: string;
}) {
  const stats = [
    { value: entries, label: "entries", icon: <Gamepad2 className="h-4 w-4" /> },
    { value: uniquePlayers, label: "players", icon: <Users className="h-4 w-4" /> },
    { value: timeRemaining, label: "remaining", icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <ArcadeCard className="p-3">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label + "-stat"} className="text-center">
            <div className="flex items-center justify-center gap-1 text-[var(--primary)] mb-1">
              {stat.icon}
            </div>
            <p className="text-lg font-bold leading-none">{stat.value}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      {topModel && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">Popular model</span>
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-[var(--accent)]" />
              <span className="font-medium">{topModel}</span>
            </div>
          </div>
        </div>
      )}
    </ArcadeCard>
  );
}

function LeaderboardTable({
  entries,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}) {
  if (isLoading) {
    const skeletonIds = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6", "sk-7", "sk-8", "sk-9", "sk-10"];
    return (
      <div className="animate-pulse">
        {skeletonIds.map((id) => (
          <div key={id} className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
            <div className="w-8 h-8 bg-[var(--muted)] rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-1/3 bg-[var(--muted)] rounded" />
              <div className="h-2.5 w-1/4 bg-[var(--muted)] rounded" />
            </div>
            <div className="w-16 h-5 bg-[var(--muted)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
        <p className="text-[var(--muted-foreground)]">No games yet - be the first to play!</p>
        <Link href="/login">
          <ArcadeButton variant="primary" size="sm" className="mt-4">
            Start Playing
          </ArcadeButton>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[var(--card)] z-10">
            <tr className="border-b border-[var(--border)]">
              <th className="text-left text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3 w-12">
                #
              </th>
              <th className="text-left text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3">
                Game
              </th>
              <th className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3 w-24">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const playerName = entry.creator?.name ?? "Anonymous";
              const score = parseFloat(entry.finalScore) || 0;

              return (
                <tr
                  key={entry.gameId}
                  className="hover:bg-[var(--muted)]/20 transition-colors group"
                >
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${getRankStyle(rank)}`}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/game/${entry.gameId}`}
                            className="font-medium text-sm hover:text-[var(--primary)] transition-colors truncate"
                          >
                            {entry.gameName || "Untitled"}
                          </Link>
                          <Link
                            href={`/game/${entry.gameId}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Play className="h-3.5 w-3.5 text-[var(--primary)]" />
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[120px]">
                            {playerName}
                          </span>
                          {entry.modelName && (
                            <>
                              <span className="text-[var(--border)]">•</span>
                              <span className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[80px]">
                                {entry.modelName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-bold text-sm text-[var(--accent)]">
                      {formatScore(score)}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {formatDateShort(entry.submittedAt ?? entry.createdAt)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="p-3 border-t border-[var(--border)]">
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full gap-1.5"
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
    </>
  );
}

function TopPerformersCard({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <ArcadeCard className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide">Top Scores</span>
      </div>
      <div className="space-y-2">
        {top3.map((entry, idx) => {
          const rank = idx + 1;
          const score = parseFloat(entry.finalScore) || 0;
          return (
            <div key={entry.gameId} className="flex items-center gap-2 text-sm">
              <span
                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${getRankStyle(rank)}`}
              >
                {rank}
              </span>
              <span className="flex-1 truncate text-[var(--foreground)]">
                {entry.gameName || "Untitled"}
              </span>
              <span className="font-mono text-[var(--accent)]">{formatScore(score)}</span>
            </div>
          );
        })}
      </div>
    </ArcadeCard>
  );
}

function ModelStatsCard({ entries }: { entries: LeaderboardEntry[] }) {
  const modelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      if (entry.modelName) {
        counts[entry.modelName] = (counts[entry.modelName] ?? 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [entries]);

  if (modelCounts.length === 0) return null;

  return (
    <ArcadeCard className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="h-4 w-4 text-[var(--primary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide">Models</span>
      </div>
      <div className="space-y-1.5">
        {modelCounts.map(([model, count]) => (
          <div key={model} className="flex items-center justify-between text-xs">
            <span className="truncate flex-1 mr-2">{model}</span>
            <ArcadeBadge text={`${count}`} variant="default" />
          </div>
        ))}
      </div>
    </ArcadeCard>
  );
}

export default function LeaderboardDashboardPage() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: currentTheme, isLoading: themeLoading } = useQuery({
    queryKey: ["currentTheme"],
    queryFn: async () => {
      try {
        return await trpcClient.themes.getCurrent.query();
      } catch {
        return null;
      }
    },
  });

  const { isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["leaderboard-dashboard", currentTheme?.id],
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
    enabled: !themeLoading,
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

  const uniquePlayers = useMemo(() => {
    const players = new Set(allEntries.map((e) => e.creator?.id).filter(Boolean));
    return players.size;
  }, [allEntries]);

  const topModel = useMemo(() => {
    const counts: Record<string, number> = {};
    allEntries.forEach((entry) => {
      if (entry.modelName) {
        counts[entry.modelName] = (counts[entry.modelName] ?? 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  }, [allEntries]);

  const timeRemaining = currentTheme?.endDate
    ? formatTimeRemaining(currentTheme.endDate)
    : "Ongoing";

  const isLoading = themeLoading || leaderboardLoading;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <DashboardHeader
        theme={currentTheme ? { title: currentTheme.title ?? "Current Theme", endDate: currentTheme.endDate } : null}
        entriesCount={allEntries.length}
        topModel={topModel}
      />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9">
            <ArcadeCard className="overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm font-semibold">Leaderboard</span>
                </div>
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={() => refetchLeaderboard()}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </ArcadeButton>
              </div>
              <LeaderboardTable
                entries={allEntries}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
              />
            </ArcadeCard>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <QuickStats
              entries={allEntries.length}
              uniquePlayers={uniquePlayers}
              topModel={topModel}
              timeRemaining={timeRemaining}
            />
            <TopPerformersCard entries={allEntries} />
            <ModelStatsCard entries={allEntries} />
          </div>
        </div>

        {allEntries.length > 0 && (
          <div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            {allEntries.length} entries loaded
            {hasMore && " • scroll down for more"}
          </div>
        )}
      </div>
    </div>
  );
}
