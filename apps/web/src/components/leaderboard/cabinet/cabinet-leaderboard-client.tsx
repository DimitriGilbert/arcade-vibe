"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import {
  Trophy,
  Medal,
  Crown,
  Gamepad2,
  Clock,
  User,
  Sparkles,
  Loader2,
  Play,
  Cpu,
  Star,
  GitFork,
  Code,
  FileText,
} from "lucide-react";
import type { RouterOutput } from "@/lib/trpc-types";
import { generateEmbedCode } from "@/lib/embed-utils";

type LeaderboardEntry = NonNullable<RouterOutput["leaderboard"]["getTop"]>["entries"][number];

const TOP_PLAYERS_COUNT = 3;

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

function formatPlayTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function getTimeRemaining(endDate: string | Date | null): { days: number; hours: number; minutes: number; seconds: number } | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/30">
        <Crown className="w-7 h-7 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-400/30">
        <Medal className="w-6 h-6 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/30">
        <Medal className="w-6 h-6 text-white" />
      </div>
    );
  }
  return null;
}

function CabinetCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const isTop = rank <= 3;
  const cardSize = rank === 1 ? "lg" : "md";

  const forkMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.prompts.fork.mutate({ promptId: entry.promptId });
    },
    onSuccess: (data) => {
      toast.success("Prompt forked successfully");
      window.location.href = `/editor?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  const handleCopyEmbed = useCallback(async () => {
    const embedCode = generateEmbedCode({
      gameId: entry.gameId,
      gameName: entry.gameName ?? undefined,
    });
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard");
    } catch {
      toast.error("Failed to copy embed code");
    }
  }, [entry]);

  return (
    <ArcadeCard
      variant={isTop ? "glow" : "default"}
      className={`group overflow-hidden transition-all duration-300 cursor-pointer ${
        cardSize === "lg" ? "p-6" : "p-4"
      }`}
    >
      <Link href={`/game/${entry.gameId}`} className="block">
        <div className={`flex ${cardSize === "lg" ? "flex-col items-center text-center" : "items-center gap-4"}`}>
          <div className={`${cardSize === "lg" ? "mb-4" : ""}`}>
            <RankBadge rank={rank} />
          </div>

          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 ${cardSize === "lg" ? "justify-center mb-2" : "mb-1"}`}>
              <h3 className={`font-bold ${cardSize === "lg" ? "text-xl" : "text-lg"} text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate`}>
                {entry.gameName || "Untitled Game"}
              </h3>
              {entry.tier && (
                <ArcadeBadge text={entry.tier.slug} variant="neon" />
              )}
            </div>

            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${cardSize === "lg" ? "justify-center" : ""} text-sm text-[var(--muted-foreground)]`}>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <Link
                  href={`/profile/${entry.creator?.name}`}
                  className="truncate max-w-[100px] hover:text-[var(--primary)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {entry.creator?.name || "Anonymous"}
                </Link>
              </div>
              <Link
                href={entry.modelId ? `/models/${entry.modelId}` : "/models"}
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Cpu className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{entry.modelName}</span>
              </Link>
              <div className="flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                <span>{entry.playCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatPlayTime(entry.totalPlayTimeSeconds)}</span>
              </div>
            </div>
          </div>

          <div className={`${cardSize === "lg" ? "mt-4 text-center" : "text-right"}`}>
            <div className={`font-black ${cardSize === "lg" ? "text-3xl" : "text-2xl"} text-[var(--foreground)] font-mono`}>
              {formatScore(entry.finalScore)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">points</div>
          </div>
        </div>
      </Link>

      <div className={`flex flex-wrap gap-1 mt-4 ${cardSize === "lg" ? "justify-center" : "justify-end"}`}>
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={() => forkMutation.mutate()}
          disabled={forkMutation.isPending}
        >
          <GitFork className="h-3 w-3" />
        </ArcadeButton>
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={() => handleCopyEmbed()}
        >
          <Code className="h-3 w-3" />
        </ArcadeButton>
        {entry.promptVisibility === "public" && (
          <Link href={`/prompts/document/${entry.promptId}`}>
            <ArcadeButton variant="outline" size="sm">
              <FileText className="h-3 w-3" />
            </ArcadeButton>
          </Link>
        )}
      </div>
    </ArcadeCard>
  );
}

function GridCard({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const rank = index + 4;

  const forkMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.prompts.fork.mutate({ promptId: entry.promptId });
    },
    onSuccess: (data) => {
      toast.success("Prompt forked successfully");
      window.location.href = `/editor?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  const handleCopyEmbed = useCallback(async () => {
    const embedCode = generateEmbedCode({
      gameId: entry.gameId,
      gameName: entry.gameName ?? undefined,
    });
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard");
    } catch {
      toast.error("Failed to copy embed code");
    }
  }, [entry]);

  return (
    <ArcadeCard className="group overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.02]">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] font-bold text-lg shrink-0">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={`/game/${entry.gameId}`}
              className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate mb-1 block"
            >
              {entry.gameName || "Untitled Game"}
            </Link>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Link
                href={`/profile/${entry.creator?.name}`}
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
              >
                <User className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{entry.creator?.name || "Anonymous"}</span>
              </Link>
              <span className="text-[var(--muted)]">|</span>
              <span>{entry.playCount} plays</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-bold text-lg text-[var(--foreground)] font-mono">
              {formatScore(entry.finalScore)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">pts</div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-3 justify-end">
          <Link href={`/game/${entry.gameId}`}>
            <ArcadeButton variant="outline" size="sm">
              <Play className="h-3 w-3" />
            </ArcadeButton>
          </Link>
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={() => forkMutation.mutate()}
            disabled={forkMutation.isPending}
          >
            <GitFork className="h-3 w-3" />
          </ArcadeButton>
          <ArcadeButton variant="outline" size="sm" onClick={handleCopyEmbed}>
            <Code className="h-3 w-3" />
          </ArcadeButton>
          {entry.promptVisibility === "public" && (
            <Link href={`/prompts/document/${entry.promptId}`}>
              <ArcadeButton variant="outline" size="sm">
                <FileText className="h-3 w-3" />
              </ArcadeButton>
            </Link>
          )}
        </div>
      </div>
    </ArcadeCard>
  );
}

function CountdownTimer({ endDate }: { endDate: string | Date | null }) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeRemaining) return null;

  const isEnded = timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  if (isEnded) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Clock className="h-4 w-4" />
        <span>Theme ended!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-[var(--primary)]" />
      <span className="text-[var(--muted-foreground)]">Time left:</span>
      <span className="font-mono font-bold text-[var(--foreground)]">
        {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
      </span>
    </div>
  );
}

function CabinetSkeleton() {
  const topSkeletons = ["top-1", "top-2", "top-3"];
  const gridSkeletons = Array.from({ length: 9 }, (_, i) => `grid-${i}`);

  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topSkeletons.map((key) => (
          <div key={key} className="h-40 bg-[var(--muted)] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {gridSkeletons.map((key) => (
          <div key={key} className="h-20 bg-[var(--muted)] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function CabinetLeaderboardClient() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      return await trpcClient.themes.list.query();
    },
  });

  const currentTheme = useMemo(() => {
    if (!themes) return null;
    return themes.find((t) => t.status === "active");
  }, [themes]);

  const { isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard-cabinet", currentTheme?.id],
    queryFn: async () => {
      const result = await trpcClient.leaderboard.getTop.query({
        themeId: currentTheme?.id,
        limit: 20,
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
        limit: 20,
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

  const topEntries = allEntries.slice(0, TOP_PLAYERS_COUNT);
  const remainingEntries = allEntries.slice(TOP_PLAYERS_COUNT);
  const isLoading = themesLoading || leaderboardLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
                HIGH SCORES
              </h1>
              <p className="text-[var(--muted-foreground)] font-medium">
                Ready player one? Check out who&apos;s crushing it!
              </p>
            </div>
          </div>
        </div>

        {currentTheme && (
          <ArcadeCard variant="glow" className="mb-8">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-[var(--foreground)]">
                        {currentTheme.title}
                      </h2>
                      <ArcadeBadge text="ACTIVE" variant="neon" icon={<Star className="h-3 w-3" />} />
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {currentTheme.description || "This month's creative challenge"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <CountdownTimer endDate={currentTheme.endDate ?? null} />
                  <Link href="/creator">
                    <ArcadeButton variant="primary" size="sm">
                      <Gamepad2 className="h-4 w-4" />
                      Create
                    </ArcadeButton>
                  </Link>
                </div>
              </div>
            </div>
          </ArcadeCard>
        )}

        {isLoading ? (
          <CabinetSkeleton />
        ) : (
          <>
            {allEntries.length === 0 ? (
              <ArcadeCard className="text-center py-16">
                <div className="p-8">
                  <div className="w-20 h-20 mx-auto bg-[var(--muted)] rounded-full flex items-center justify-center mb-4">
                    <Trophy className="h-10 w-10 text-[var(--muted-foreground)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                    No games yet!
                  </h3>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    Be the first to create a game and claim the top spot!
                  </p>
                  <Link href="/creator">
                    <ArcadeButton variant="primary">
                      <Play className="h-4 w-4 mr-2" />
                      Start Creating
                    </ArcadeButton>
                  </Link>
                </div>
              </ArcadeCard>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Top Players
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topEntries.map((entry, index) => (
                      <CabinetCard
                        key={entry.gameId}
                        entry={entry}
                        rank={index + 1}
                      />
                    ))}
                  </div>
                </div>

                {remainingEntries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
                      More Games
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {remainingEntries.map((entry, index) => (
                        <GridCard
                          key={entry.gameId}
                          entry={entry}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {hasMore && (
                  <div className="mt-6 text-center">
                    <ArcadeButton
                      variant="outline"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="h-4 w-4" />
                          Load More Games
                        </>
                      )}
                    </ArcadeButton>
                  </div>
                )}

                <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                  {allEntries.length} {allEntries.length === 1 ? "game" : "games"} in the cabinet
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
