"use client";

import type { LeaderboardEntry } from "@/lib/trpc-types";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { trpcClient } from "@/utils/trpc";
import {
  ArcadeCard,
  ArcadeBadge,
  ArcadeButton,
} from "@/components/arcade";
import { LoadingState } from "@/components/reusable";
import {
  Trophy,
  Medal,
  Sparkles,
  Clock,
  TrendingUp,
  Gamepad2,
  Calendar,
  ArrowRight,
} from "lucide-react";

function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function CoverStoryCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const gameName = entry.gameName ?? "Untitled Game";
  const creator = entry.creator;
  const score = parseFloat(entry.finalScore) || 0;

  const rankStyles = {
    1: {
      container: "bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/30",
      badge: "bg-yellow-500 text-yellow-950",
      rankText: "GOLD",
    },
    2: {
      container: "bg-gradient-to-br from-slate-400/10 via-slate-300/5 to-transparent border-slate-400/30",
      badge: "bg-slate-400 text-slate-950",
      rankText: "SILVER",
    },
    3: {
      container: "bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border-amber-600/30",
      badge: "bg-amber-600 text-amber-50",
      rankText: "BRONZE",
    },
  };

  const style = rankStyles[rank as keyof typeof rankStyles] ?? rankStyles[1];

  return (
    <ArcadeCard variant={rank === 1 ? "glow" : "default"} className={`overflow-hidden ${style.container}`}>
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
            {style.rankText}
          </span>
        </div>

        <div className="p-6 pt-14">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <Gamepad2 className="h-8 w-8 text-[var(--primary)]" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-1 line-clamp-1">{gameName}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">by {creator.name ?? "Anonymous"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {entry.tier && (
              <ArcadeBadge text={entry.tier.name} variant="default" />
            )}
            {entry.theme && (
              <span className="text-xs text-[var(--muted-foreground)]">{entry.theme.title}</span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-6">
            <div>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Score</p>
              <p className="text-2xl font-black text-[var(--primary)]">{score.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Model</p>
              <p className="text-sm font-medium">{entry.modelName}</p>
            </div>
          </div>

          <Link href={`/game/${entry.gameId}`} className="block mt-6">
            <ArcadeButton variant="primary" className="w-full">
              <Gamepad2 className="h-4 w-4" />
              Play This Game
            </ArcadeButton>
          </Link>
        </div>
      </div>
    </ArcadeCard>
  );
}

function CompactLeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const gameName = entry.gameName ?? "Untitled Game";
  const creator = entry.creator;
  const score = parseFloat(entry.finalScore) || 0;

  return (
    <Link href={`/game/${entry.gameId}`} className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/20 transition-colors group">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          rank === 1
            ? "bg-yellow-500/20 text-yellow-500"
            : rank === 2
              ? "bg-slate-400/20 text-slate-400"
              : rank === 3
                ? "bg-amber-600/20 text-amber-600"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
        }`}
      >
        {rank <= 3 ? <Medal className="h-5 w-5" /> : rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-[var(--primary)] transition-colors">{gameName}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{creator.name ?? "Anonymous"}</p>
      </div>

      {entry.tier && (
        <ArcadeBadge text={entry.tier.slug} variant="default" className="shrink-0" />
      )}

      <div className="text-right shrink-0">
        <p className="font-bold">{score.toLocaleString()}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{entry.modelName}</p>
      </div>

      <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

function ThemeHero({
  title,
  description,
  endDate,
  entryCount,
}: {
  title: string;
  description: string | null | undefined;
  endDate: string | null | undefined;
  entryCount: number;
}) {
  const timeRemaining = endDate ? formatTimeRemaining(new Date(endDate)) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 via-[var(--card)] to-[var(--card)] border border-[var(--border)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative p-8 md:p-12">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-[var(--primary)]" />
          <ArcadeBadge text="This Month's Theme" variant="neon" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{title.toUpperCase()}</h1>

        <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mb-6">
          {description ?? "Check out what people are building this month!"}
        </p>

        <div className="flex flex-wrap items-center gap-8">
          {timeRemaining && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Time Left</p>
                <p className="text-xl font-bold text-[var(--accent)]">{timeRemaining}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--muted-foreground)]" />
            <div>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Entries</p>
              <p className="text-xl font-bold">{entryCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardMagazineClient() {
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

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard", currentTheme?.id],
    queryFn: async () => {
      if (!currentTheme?.id) return null;
      return await trpcClient.leaderboard.getTop.query({
        themeId: currentTheme.id,
        limit: 50,
      });
    },
    enabled: !!currentTheme?.id,
  });

  const isLoading = themeLoading || leaderboardLoading;
  const leaderboard = leaderboardData?.entries ?? [];
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <LoadingState size="lg" message="Loading the leaderboard..." />
        </div>
      </main>
    );
  }

  if (!currentTheme) {
    return (
      <main className="min-h-screen bg-[var(--background)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <ArcadeCard className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
            <h1 className="text-2xl font-bold mb-4">No Active Theme</h1>
            <p className="text-[var(--muted-foreground)] mb-8">Check back soon for the next exciting theme!</p>
            <Link href="/leaderboard">
              <ArcadeButton variant="primary">
                <Gamepad2 className="h-4 w-4" />
                Browse Past Games
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <ThemeHero
          title={currentTheme.title}
          description={currentTheme.description}
          endDate={currentTheme.endDate}
          entryCount={leaderboard.length}
        />

        {leaderboard.length === 0 ? (
          <ArcadeCard className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">Be the First!</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              No games submitted yet. Why not create one and take the top spot?
            </p>
            <Link href="/leaderboard">
              <ArcadeButton variant="glow">
                <Gamepad2 className="h-4 w-4" />
                Create a Game
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        ) : (
          <>
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="h-6 w-6 text-[var(--accent)]" />
                <h2 className="text-2xl font-bold">The Podium</h2>
              </div>
              <p className="text-[var(--muted-foreground)] mb-8">
                These creators are crushing it this month. Give their games a play and see if you agree with the
                rankings!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {top3.map((entry, idx) => (
                  <CoverStoryCard key={entry.gameId} entry={entry} rank={idx + 1} />
                ))}
              </div>
            </section>

            {rest.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <h2 className="text-xl font-bold">The Rest of the Pack</h2>
                </div>
                <p className="text-[var(--muted-foreground)] mb-6">
                  Plenty of awesome games to discover here. Every play counts!
                </p>

                <ArcadeCard>
                  <div className="divide-y divide-[var(--border)]">
                    {rest.map((entry, idx) => (
                      <CompactLeaderboardRow key={entry.gameId} entry={entry} rank={idx + 4} />
                    ))}
                  </div>
                </ArcadeCard>
              </section>
            )}
          </>
        )}

        <section className="pb-12">
          <ArcadeCard className="p-8 text-center bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
            <h3 className="text-xl font-bold mb-3">Want to join the fun?</h3>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              Write a prompt, pick your AI model, and see what you can create. It's that simple.
            </p>
            <Link href="/leaderboard">
              <ArcadeButton variant="glow" size="lg">
                <Gamepad2 className="h-5 w-5" />
                Start Creating
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        </section>
      </div>
    </main>
  );
}