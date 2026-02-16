"use client";

import type { Route } from "next";
import type { ReactNode } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Gamepad2,
  Send,
  Trophy,
  Zap,
  Star,
  Users,
  Code2,
  Timer,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";

import {
  ArcadeCard,
  ArcadeButton,
  ArcadeBadge,
  ArcadeStats,
} from "@/components/arcade";
import { trpcClient } from "@/utils/trpc";
import { LoadingState } from "@/components/reusable";

const HOW_IT_WORKS_STEPS = [
  {
    title: "WRITE",
    description:
      "Write a prompt that makes an AI build a game. One message, no do-overs.",
    icon: Code2,
  },
  {
    title: "PICK",
    description:
      "Pick your model. Easy mode with big AIs, or go hard with smaller ones.",
    icon: Send,
  },
  {
    title: "PLAY",
    description:
      "People play your game, rate it. See where you land on the board.",
    icon: Trophy,
  },
] as const;

const MODEL_TIERS = [
  {
    name: "Easy",
    models: "GPT-5.3, Opus-4.6",
    multiplier: "1x",
    description: "Big models. Easy wins. No bragging rights.",
    variant: "default" as const,
  },
  {
    name: "Normal",
    models: "GLM-4.7, Kimi-k2.5",
    multiplier: "1.5x",
    description: "The sweet spot.",
    variant: "default" as const,
  },
  {
    name: "Hard",
    models: "Deepseek-3.2, GPT-5.1-mini, Haiku-4.5",
    multiplier: "2x",
    description: "Now we're talking.",
    variant: "neon" as const,
  },
  {
    name: "Insane",
    models: "Tiny models",
    multiplier: "3x",
    description: "Tiny models. Big flex if you pull it off.",
    variant: "neon" as const,
  },
] as const;

function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative py-16 md:py-24 ${className ?? ""}`}>
      {children}
    </section>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

function HeroSection() {
  return (
    <Section className="home-hero">
      <div className="home-hero-grid">
        <div className="home-hero-grid-lines" />
        <div className="home-hero-horizon" />
      </div>
      <div className="home-content text-center px-4 max-w-5xl mx-auto">
        <h1 className="home-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6">
          <span className="home-title-main">ARCADE</span>
          <span className="home-title-sub">VIBE</span>
        </h1>

        <p className="home-subtitle text-xl md:text-2xl lg:text-3xl text-[var(--foreground)] mb-4 font-semibold">
          Make games with AI. Compete with friends. Get better at prompting
          while you're at it.
        </p>

        <p className="text-base md:text-lg text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto">
          A chill place to test your prompting skills, play some fun games, and
          see how different AI models stack up.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={"/arcade" as Route}>
            <ArcadeButton variant="glow" size="lg">
              <Play className="size-5" />
              Play Games
            </ArcadeButton>
          </Link>
          <Link href={"/arcade" as Route}>
            <ArcadeButton variant="outline" size="lg">
              <Trophy className="size-5" />
              Leaderboard
            </ArcadeButton>
          </Link>
        </div>
      </div>
    </Section>
  );
}

function HowItWorksSection() {
  return (
    <Section className="bg-[var(--card)]/30">
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle title="How It Works" subtitle="Pretty simple, actually" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <ArcadeCard
                key={step.title}
                variant="glow"
                className="text-center hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="p-6">
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--primary)]">
                      {index + 1}
                    </span>
                  </div>

                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <Icon className="size-8 text-[var(--primary)]" />
                  </div>

                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[var(--muted-foreground)]">
                    {step.description}
                  </p>
                </div>
              </ArcadeCard>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function ModelTiersSection() {
  return (
    <Section>
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="Choose Your Model"
          subtitle="Harder models = bigger bragging rights"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODEL_TIERS.map((tier) => (
            <ArcadeCard
              key={tier.name}
              className="relative overflow-hidden hover:border-[var(--primary)] transition-colors duration-300"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <ArcadeBadge
                    text={tier.name}
                    variant={tier.variant}
                    className="text-sm"
                  />
                  <span className="text-lg font-bold text-[var(--accent)]">
                    {tier.multiplier}
                  </span>
                </div>

                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  {tier.models}
                </p>

                <p className="text-xs text-[var(--muted-foreground)]">
                  {tier.description}
                </p>

                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-[var(--accent)]" />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Score Multiplier
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--muted)]">
                    <div
                      className={`h-full rounded-full bg-[var(--accent)] ${
                        tier.multiplier === "1x"
                          ? "w-1/4"
                          : tier.multiplier === "1.5x"
                            ? "w-1/2"
                            : tier.multiplier === "2x"
                              ? "w-3/4"
                              : "w-full"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </ArcadeCard>
          ))}
        </div>
      </div>
    </Section>
  );
}

function MonthlyChallengeSection() {
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
      return await trpcClient.leaderboard.getTop.query({
        themeId: currentTheme!.id,
        limit: 3,
      });
    },
    enabled: !!currentTheme?.id,
  });

  const leaderboard = leaderboardData?.entries ?? [];

  const themeTitle = currentTheme?.title ?? "No Active Theme";
  const themeDescription =
    currentTheme?.description ?? "Check back soon for the next challenge.";
  const timeRemaining = currentTheme?.endDate
    ? formatTimeRemaining(new Date(currentTheme.endDate))
    : null;

  return (
    <Section className="bg-[var(--card)]/30">
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="This Month's Theme"
          subtitle="New theme each month. New games to play. New people to beat."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ArcadeCard variant="glow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="size-6 text-[var(--accent)]" />
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Current Theme
                </h3>
              </div>

              {themeLoading ? (
                <LoadingState size="md" message="Loading theme..." />
              ) : (
                <>
                  <h4 className="text-3xl font-black text-[var(--primary)] mb-4">
                    {themeTitle.toUpperCase()}
                  </h4>

                  <p className="text-sm text-[var(--muted-foreground)] mb-6">
                    {themeDescription}
                  </p>

                  {timeRemaining && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--background)]/50">
                      <Timer className="size-5 text-[var(--accent)]" />
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Time remaining
                        </p>
                        <p className="text-lg font-bold text-[var(--foreground)]">
                          {timeRemaining}
                        </p>
                      </div>
                    </div>
                  )}

                  <Link href={"/arcade" as Route} className="block mt-6">
                    <ArcadeButton variant="primary" className="w-full">
                      Join In
                      <ArrowRight className="size-4" />
                    </ArcadeButton>
                  </Link>
                </>
              )}
            </div>
          </ArcadeCard>

          <ArcadeCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="size-6 text-[var(--accent)]" />
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Top Players
                </h3>
              </div>

              {leaderboardLoading ? (
                <LoadingState size="md" message="Loading leaderboard..." />
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <p>No players yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const playerName =
                      entry.game.prompt.user.name ?? "Anonymous";
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-[var(--background)]/50 hover:bg-[var(--primary)]/10 transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            rank === 1
                              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                              : rank === 2
                                ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                                : "bg-[var(--secondary)]/15 text-[var(--secondary)]"
                          }`}
                        >
                          {rank}
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-[var(--foreground)]">
                            {playerName}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {entry.score.toLocaleString()} points
                          </p>
                        </div>

                        <ArcadeBadge
                          text={entry.score.toLocaleString()}
                          variant="default"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <Link href={"/arcade" as Route} className="block mt-6">
                <ArcadeButton variant="outline" className="w-full">
                  See Full Leaderboard
                </ArcadeButton>
              </Link>
            </div>
          </ArcadeCard>
        </div>
      </div>
    </Section>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="animate-pulse h-8 w-16 bg-[var(--muted)] rounded-md" />
      <div className="animate-pulse h-4 w-24 bg-[var(--muted)] rounded-md" />
    </div>
  );
}

function StatsSection() {
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      return await trpcClient.themes.list.query();
    },
  });

  const currentTheme = themes?.find((t) => t.status === "active");

  const { data: gamesResponse, isLoading: gamesLoading } = useQuery({
    queryKey: ["homeGames", currentTheme?.id],
    queryFn: async () => {
      if (!currentTheme?.id) return null;
      return await trpcClient.games.listByTheme.query({
        themeId: currentTheme.id,
        includeSubmitted: true,
        limit: 100,
      });
    },
    enabled: !!currentTheme?.id,
  });

  const games = gamesResponse?.games ?? [];

  const isLoading =
    themesLoading || gamesLoading || (!gamesResponse && currentTheme?.id);

  const gamesCount = games.length;
  const uniqueCreators = games
    ? new Set(games.map((g) => g.prompt.authorId)).size
    : 0;

  const stats = [
    {
      value: gamesCount.toLocaleString(),
      label: "Games Created",
      icon: <Gamepad2 className="size-4" />,
    },
    {
      value: uniqueCreators.toLocaleString(),
      label: "Creators",
      icon: <Users className="size-4" />,
    },
    {
      value: themes?.length.toLocaleString() ?? "0",
      label: "Themes",
      icon: <Star className="size-4" />,
    },
    {
      value: "Live",
      label: "Competition",
      icon: <Code2 className="size-4" />,
    },
  ];

  return (
    <Section>
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="By the Numbers"
          subtitle="People making games, playing games, comparing models"
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        ) : (
          <ArcadeStats stats={stats} className="max-w-4xl mx-auto" />
        )}
      </div>
    </Section>
  );
}

function CTASection() {
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 home-cta-glow" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-6">
          Wanna try it?
        </h2>

        <p className="text-lg text-[var(--muted-foreground)] mb-8">
          Write prompts. Make games. See what happens.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={"/login" as Route}>
            <ArcadeButton variant="glow" size="lg">
              <Gamepad2 className="size-5" />
              Sign Up
            </ArcadeButton>
          </Link>
          <Link href={"/arcade" as Route}>
            <ArcadeButton variant="secondary" size="lg">
              Browse Games
            </ArcadeButton>
          </Link>
        </div>

        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Come hang out at{" "}
          <span className="font-bold text-[var(--primary)]">Arcade Vibe</span>.
        </p>
      </div>
    </Section>
  );
}

export default function Home() {
  return (
    <>
      <main className="home-shell bg-[var(--background)] text-[var(--foreground)]">
        <div className="home-backdrop">
          <div className="home-sky" />
          <div className="home-sun" />
          <div className="home-grid" />
          <div className="home-horizon" />
          <div className="home-decor-1" />
          <div className="home-decor-2" />
          <div className="home-decor-3" />
          <div className="home-scanlines" />
          <div className="home-vignette" />
        </div>
        <div className="home-content">
          <HeroSection />
          <HowItWorksSection />
          <ModelTiersSection />
          <MonthlyChallengeSection />
          <StatsSection />
          <CTASection />
        </div>
      </main>
    </>
  );
}
