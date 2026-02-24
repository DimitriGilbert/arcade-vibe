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
  TrendingUp,
  GraduationCap,
  BarChart3,
  Scale,
  Heart,
} from "lucide-react";

import {
  ArcadeCard,
  ArcadeButton,
  ArcadeBadge,
} from "@/components/arcade";
import { trpcClient } from "@/utils/trpc";
import { LoadingState } from "@/components/reusable";

const MODEL_TIERS = [
  { name: "Easy", models: "GPT-5.3, Opus-4.6", multiplier: "1x", description: "Big models. Easy wins." },
  { name: "Normal", models: "GLM-4.7, Kimi-k2.5", multiplier: "1.5x", description: "The sweet spot." },
  { name: "Hard", models: "Deepseek-3.2, GPT-5.1-mini", multiplier: "2x", description: "Now we're talking." },
  { name: "Insane", models: "Tiny models", multiplier: "3x", description: "Big flex if you pull it off." },
] as const;

function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function Masthead() {
  return (
    <header className="home-hero relative py-20 md:py-32">
      <div className="home-hero-grid">
        <div className="home-hero-grid-lines" />
        <div className="home-hero-horizon" />
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-4">
              Make games with AI. Compete with friends.
            </p>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none">
              <span className="block home-title-main">ARCADE</span>
              <span className="block text-[var(--muted-foreground)] home-title-sub">VIBE</span>
            </h1>
          </div>
          
          <div className="lg:col-span-4">
            <p className="text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed mb-4 font-semibold">
              A chill place to test your prompting skills, play some fun games, and see how different AI models stack up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={"/leaderboard" as Route}>
                <ArcadeButton variant="glow" size="lg">
                  <Play className="size-5" />
                  Play Games
                </ArcadeButton>
              </Link>
              <Link href={"/leaderboard" as Route}>
                <ArcadeButton variant="outline" size="lg">
                  <Trophy className="size-5" />
                  Leaderboard
                </ArcadeButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeaturedArticle() {
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

  const { data: leaderboardData } = useQuery({
    queryKey: ["leaderboard", currentTheme?.id],
    queryFn: async () => {
      return await trpcClient.leaderboard.getTop.query({
        themeId: currentTheme!.id,
        limit: 5,
      });
    },
    enabled: !!currentTheme?.id,
  });

  const themeTitle = currentTheme?.title ?? "No Active Theme";
  const themeDescription = currentTheme?.description ?? "Check back soon for the next challenge.";
  const timeRemaining = currentTheme?.endDate ? formatTimeRemaining(new Date(currentTheme.endDate)) : null;
  const leaderboard = leaderboardData?.entries ?? [];

  return (
    <article className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <span className="px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold uppercase tracking-wider">
            This Month
          </span>
          <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
            New theme. New games. New people to beat.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <ArcadeCard variant="glow" className="h-full">
              <div className="p-8">
                {themeLoading ? (
                  <LoadingState size="md" message="Loading..." />
                ) : (
                  <>
                    <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                      {themeTitle.toUpperCase()}
                    </h2>
                    <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-8 max-w-xl">
                      {themeDescription}
                    </p>
                    
                    <div className="flex items-center gap-8 mb-8">
                      {timeRemaining && (
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Time Left</p>
                          <p className="text-2xl font-bold text-[var(--accent)]">{timeRemaining}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Entries</p>
                        <p className="text-2xl font-bold">{leaderboard.length}</p>
                      </div>
                    </div>

                    <Link href={"/leaderboard" as Route}>
                      <ArcadeButton variant="primary">
                        Join Challenge
                        <ArrowRight className="size-4" />
                      </ArcadeButton>
                    </Link>
                  </>
                )}
              </div>
            </ArcadeCard>
          </div>

          <aside className="lg:col-span-5">
            <ArcadeCard className="h-full">
              <div className="p-6 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="size-4 text-[var(--accent)]" />
                  Leaderboard
                </h3>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-[var(--muted-foreground)]">
                    Be the first to enter!
                  </div>
                ) : (
                  leaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    const playerName = entry.creator?.name ?? "Anonymous";
                    const score = parseFloat(entry.finalScore) || 0;
                    return (
                      <div key={entry.gameId} className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/20 transition-colors">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                          rank === 2 ? "bg-slate-400/20 text-slate-400" :
                          rank === 3 ? "bg-amber-600/20 text-amber-600" :
                          "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        }`}>
                          {rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{playerName}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{score.toLocaleString()} pts</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t border-[var(--border)]">
                <Link href={"/leaderboard" as Route}>
                  <ArcadeButton variant="outline" className="w-full">
                    View Full Board
                  </ArcadeButton>
                </Link>
              </div>
            </ArcadeCard>
          </aside>
        </div>
      </div>
    </article>
  );
}

function QuickStats() {
  const { data: themes } = useQuery({
    queryKey: ["themes"],
    queryFn: async () => await trpcClient.themes.list.query(),
  });

  const currentTheme = themes?.find((t) => t.status === "active");

  const { data: gamesResponse } = useQuery({
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
  const gamesCount = games.length;
  const uniqueCreators = new Set(games.map((g) => g.prompt.authorId)).size;

  const stats = [
    { value: gamesCount.toLocaleString(), label: "Games" },
    { value: uniqueCreators.toLocaleString(), label: "Creators" },
    { value: themes?.length.toLocaleString() ?? "0", label: "Themes" },
  ];

  return (
    <div className="py-8 border-y border-[var(--border)] bg-[var(--card)]/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-12 md:gap-24">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl md:text-5xl font-black text-[var(--primary)]">{stat.value}</p>
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureSplit() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">
              Pretty simple, actually
            </h2>
            <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-8">
              Write a prompt that makes an AI build a game. One message, no do-overs. Pick your model difficulty and see where you land.
            </p>
            <div className="space-y-4">
              {[
                { icon: Code2, title: "WRITE", desc: "Write a prompt that makes an AI build a game. One message, no do-overs." },
                { icon: Send, title: "PICK", desc: "Pick your model. Easy mode with big AIs, or go hard with smaller ones." },
                { icon: Trophy, title: "PLAY", desc: "People play your game, rate it. See where you land on the board." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/20 transition-colors">
                    <item.icon className="size-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {MODEL_TIERS.map((tier, idx) => (
              <ArcadeCard 
                key={tier.name} 
                className={`p-5 ${idx >= 2 ? 'border-[var(--accent)]/30' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold">{tier.name}</span>
                  <ArcadeBadge text={tier.multiplier} variant={idx >= 2 ? 'neon' : 'default'} />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">{tier.models}</p>
                <p className="text-xs text-[var(--muted-foreground)]/60">{tier.description}</p>
              </ArcadeCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LearnBento() {
  return (
    <section className="py-20 bg-[var(--card)]/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">More Than Just Games</span>
          <h2 className="text-4xl md:text-5xl font-black mt-4">
            Get better. Figure stuff out.
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <ArcadeCard className="col-span-12 md:col-span-7 row-span-2 p-8 flex flex-col">
            <div className="flex-1">
              <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-6">
                <GraduationCap className="size-7 text-[var(--primary)]" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                You actually get better at this
              </h3>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-6">
                Every prompt you write teaches you something. The good ones, the ones that flop—all of it. Watch your own progress, see what works, figure out why.
              </p>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Public prompts become case studies. Read what the winners wrote, try it yourself, learn from it. No gatekeeping here.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-[var(--primary)]">100%</span>
                  <p className="text-xs text-[var(--muted-foreground)]">Public winning prompts</p>
                </div>
                <div className="w-px h-10 bg-[var(--border)]" />
                <div>
                  <span className="text-2xl font-bold">∞</span>
                  <p className="text-xs text-[var(--muted-foreground)]">Things to learn</p>
                </div>
              </div>
            </div>
          </ArcadeCard>

          <ArcadeCard className="col-span-12 sm:col-span-6 md:col-span-5 p-6">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-4">
              <Scale className="size-6 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Compare models head-to-head</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Run the same prompt on GPT, Claude, Deepseek, whoever. See who delivers. Build your own benchmarks with real tasks, not synthetic tests.
            </p>
          </ArcadeCard>

          <ArcadeCard className="col-span-12 sm:col-span-6 md:col-span-5 p-6">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="size-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Scoring that rewards skill</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Shorter prompts score higher. Harder models multiply your points. Actual playtime matters. Can't game the system with copy-paste junk.
            </p>
          </ArcadeCard>

          <ArcadeCard className="col-span-12 sm:col-span-6 md:col-span-4 p-6 bg-gradient-to-br from-[var(--card)] to-[var(--primary)]/5">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center mb-3">
              <Users className="size-5 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-bold mb-2">Learn from everyone</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Every public prompt is a lesson. Fork it, tweak it, run it on a different model.
            </p>
          </ArcadeCard>

          <ArcadeCard className="col-span-12 sm:col-span-6 md:col-span-4 p-6">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-3">
              <Heart className="size-5 text-pink-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Actually fun</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Not a course. Not homework. Just games, competition, and a reason to keep improving.
            </p>
          </ArcadeCard>

          <ArcadeCard variant="glow" className="col-span-12 md:col-span-4 p-6 flex flex-col justify-center">
            <div className="text-center">
              <p className="text-5xl font-black text-[var(--primary)] mb-2">1</p>
              <p className="text-sm font-bold uppercase tracking-wider">Prompt. That's it.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">No tricks, no workarounds</p>
            </div>
          </ArcadeCard>
        </div>
      </div>
    </section>
  );
}

function Outro() {
  return (
    <footer className="py-24 relative">
      <div className="absolute inset-0 opacity-20 home-cta-glow" />
      <div className="max-w-3xl mx-auto px-4 text-center relative">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
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
          <Link href={"/leaderboard" as Route}>
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
    </footer>
  );
}

export default function HomeMagazine() {
  return (
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
        <Masthead />
        <QuickStats />
        <FeaturedArticle />
        <FeatureSplit />
        <LearnBento />
        <Outro />
      </div>
    </main>
  );
}
