import type { Route } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";

import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { themes } from "@arcade-vibe/db/schema/themes";
import { games, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { scores } from "@arcade-vibe/db/schema/scores";
import { user } from "@arcade-vibe/db/schema/auth";
import { desc, eq, asc, and, isNull, sql, count, isNotNull, sum } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";

import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";

export const dynamic = "force-dynamic";

function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

async function Masthead() {
  return (
    <header className="home-hero relative py-12 md:py-20">
      <div className="home-hero-grid">
        <div className="home-hero-grid-lines" />
        <div className="home-hero-horizon" />
      </div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-4">
              Make games with AI. Compete with friends.
            </p>
            <h1 className="text-4xl sm:text-7xl md:text-9xl font-black tracking-tight leading-none">
              <span className="block home-title-main">ARCADE</span>
              <span className="block text-[var(--muted-foreground)] home-title-sub">
                VIBE
              </span>
            </h1>
          </div>

          <div className="lg:col-span-4">
            <p className="text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed mb-4 font-semibold">
              A chill place to test your prompting skills, play some fun games,
              and see how different AI models stack up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={"/leaderboard" as Route}>
                <ArcadeButton variant="glow" size="lg">
                  Play Games
                </ArcadeButton>
              </Link>
              <Link href={"/leaderboard" as Route}>
                <ArcadeButton variant="outline" size="lg">
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

async function getHomepageData() {
  const [allThemes, allTierCosts, allModels] = await Promise.all([
    db.query.themes.findMany({
      orderBy: [desc(themes.createdAt)],
    }),
    db.query.tierCosts.findMany({
      where: eq(tierCosts.isActive, true),
      orderBy: [asc(tierCosts.displayOrder)],
    }),
    db.query.modelConfig.findMany({
      where: eq(modelConfig.isActive, true),
      orderBy: [desc(modelConfig.modelCreatedAt)],
      with: {
        tierCost: true,
      },
    }),
  ]);

  const currentTheme = allThemes.find((t) => t.status === "active");

  let leaderboard: Array<{
    gameId: string;
    gameName: string | null;
    finalScore: string;
    creatorId: string;
    creatorName: string | null;
    modelName: string;
    tierName: string;
    playCount: number;
  }> = [];

  let gamesCount = 0;
  let uniqueCreators = 0;

  if (currentTheme?.id) {
    const leaderboardResult = await db
      .select({
        gameId: games.id,
        gameName: games.name,
        finalScore: sql<string>`COALESCE(${scores.finalScore}, '0')`,
        creatorId: user.id,
        creatorName: user.name,
        modelName: games.modelName,
        tierName: tierCosts.name,
      })
      .from(games)
      .innerJoin(prompts, eq(games.promptId, prompts.id))
      .innerJoin(user, eq(prompts.authorId, user.id))
      .innerJoin(tierCosts, eq(games.tierCostId, tierCosts.id))
      .leftJoin(scores, eq(games.id, scores.gameId))
      .where(
        and(
          eq(games.themeId, currentTheme.id),
          eq(games.isSubmitted, true),
          eq(games.isHidden, false),
          isNull(games.deletedAt),
          eq(games.status, "completed"),
        ),
      )
      .orderBy(desc(sql`COALESCE(${scores.finalScore}::numeric, 0)`))
      .limit(5);

    const gameIds = leaderboardResult.map((r) => r.gameId);

    const playStats =
      gameIds.length > 0
        ? await db
            .select({
              gameId: gameSessionMetrics.gameId,
              playCount: count(),
            })
            .from(gameSessionMetrics)
            .where(
              and(
                sql`${gameSessionMetrics.gameId} IN ${gameIds}`,
                isNotNull(gameSessionMetrics.endedAt),
              ),
            )
            .groupBy(gameSessionMetrics.gameId)
        : [];

    const playStatsMap = new Map(
      playStats.map((s) => [s.gameId, Number(s.playCount ?? 0)]),
    );

    leaderboard = leaderboardResult.map((row) => ({
      gameId: row.gameId,
      gameName: row.gameName,
      finalScore: row.finalScore ?? "0",
      creatorId: row.creatorId,
      creatorName: row.creatorName,
      modelName: row.modelName,
      tierName: row.tierName,
      playCount: playStatsMap.get(row.gameId) ?? 0,
    }));

    const gamesResult = await db.query.games.findMany({
      where: and(
        eq(games.themeId, currentTheme.id),
        eq(games.isSubmitted, true),
        isNull(games.deletedAt),
      ),
      columns: {
        id: true,
      },
      with: {
        prompt: {
          columns: {
            authorId: true,
          },
        },
      },
    });

    gamesCount = gamesResult.length;
    const creatorIds = new Set(
      gamesResult.map((g) => g.prompt?.authorId).filter(Boolean),
    );
    uniqueCreators = creatorIds.size;
  }

  const tiersWithModels = allTierCosts.map((tier) => {
    const tierModels = allModels
      .filter((m) => m.tierCost?.slug === tier.slug)
      .slice(0, 2)
      .map((m) => m.modelName);
    return {
      name: tier.name,
      slug: tier.slug,
      multiplier: `${tier.scoreMultiplier}x`,
      description: tier.description ?? "",
      models: tierModels.length > 0 ? tierModels.join(", ") : "Various models",
    };
  });

  return {
    currentTheme,
    leaderboard,
    gamesCount,
    uniqueCreators,
    themesCount: allThemes.length,
    tiersWithModels,
  };
}

const getCachedHomepageData = unstable_cache(
  getHomepageData,
  ["homepage-data"],
  { revalidate: 60 },
);

async function FeaturedArticle(props: Pick<Awaited<ReturnType<typeof getHomepageData>>, "currentTheme" | "leaderboard">) {
  const { currentTheme, leaderboard } = props;

  const themeTitle = currentTheme?.title ?? "No Active Theme";
  const themeDescription =
    currentTheme?.description ?? "Check back soon for the next challenge.";
  const timeRemaining = currentTheme?.endDate
    ? formatTimeRemaining(new Date(currentTheme.endDate))
    : null;

  return (
    <article className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
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
                <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                  {themeTitle.toUpperCase()}
                </h2>
                <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-8 max-w-xl">
                  {themeDescription}
                </p>

                <div className="flex items-center gap-8 mb-8">
                  {timeRemaining && (
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                        Time Left
                      </p>
                      <p className="text-2xl font-bold text-[var(--accent)]">
                        {timeRemaining}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                      Entries
                    </p>
                    <p className="text-2xl font-bold">{leaderboard.length}</p>
                  </div>
                </div>

                <Link href={"/leaderboard" as Route}>
                  <ArcadeButton variant="primary">Join Challenge</ArcadeButton>
                </Link>
              </div>
            </ArcadeCard>
          </div>

          <aside className="lg:col-span-5">
            <ArcadeCard className="h-full flex flex-col">
              <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/10">
                <h3 className="text-xs font-bold uppercase tracking-wider">Leaderboard</h3>
              </div>
              <div className="flex-1 divide-y divide-[var(--border)]">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">
                    Be the first to enter!
                  </div>
                ) : (
                  leaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    const score = parseFloat(entry.finalScore) || 0;
                    return (
                      <div
                        key={entry.gameId}
                        className="flex items-center gap-3 px-4 py-2"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            rank === 1
                              ? "bg-yellow-500/20 text-yellow-500"
                              : rank === 2
                                ? "bg-slate-400/20 text-slate-400"
                                : rank === 3
                                  ? "bg-amber-600/20 text-amber-600"
                                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          {rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link href={`/game/${entry.gameId}` as Route} prefetch={false} className="font-medium text-sm truncate hover:text-[var(--primary)] block">
                            {entry.gameName ?? "Untitled"}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <Link href={`/profile/${entry.creatorName ?? "anonymous"}` as Route} prefetch={false} className="truncate hover:text-[var(--primary)]">
                              {entry.creatorName ?? "Anonymous"}
                            </Link>
                            <span className="text-[var(--border)]">·</span>
                            <Link href={`/models?model=${encodeURIComponent(entry.modelName)}` as Route} prefetch={false} className="truncate hover:text-[var(--primary)]">
                              {entry.modelName}
                            </Link>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm">{score.toLocaleString()}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{entry.playCount} plays</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-[var(--border)]">
                <Link href={"/leaderboard" as Route} className="block text-center text-xs font-medium text-[var(--primary)] hover:underline">
                  View Full Board →
                </Link>
              </div>
            </ArcadeCard>
          </aside>
        </div>
      </div>
    </article>
  );
}

async function QuickStats(props: Pick<Awaited<ReturnType<typeof getHomepageData>>, "gamesCount" | "uniqueCreators" | "themesCount">) {
  const { gamesCount, uniqueCreators, themesCount } = props;

  const stats = [
    { value: gamesCount.toLocaleString(), label: "Games" },
    { value: uniqueCreators.toLocaleString(), label: "Creators" },
    { value: themesCount.toLocaleString(), label: "Themes" },
  ];

  return (
    <div className="py-8 border-y border-[var(--border)] bg-[var(--card)]/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-12 md:gap-24">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl md:text-5xl font-black text-[var(--primary)]">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function FeatureSplit(props: Pick<Awaited<ReturnType<typeof getHomepageData>>, "tiersWithModels">) {
  const { tiersWithModels } = props;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ArcadeCard className="p-8 md:p-10">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                How It Works
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">
                Pretty simple, actually
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-8">
                Write a prompt that makes an AI build a game. One message, no
                do-overs. Pick your model difficulty and see where you land.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "WRITE",
                    desc: "Write a prompt that makes an AI build a game. One message, no do-overs.",
                  },
                  {
                    title: "PICK",
                    desc: "Pick your model. Easy mode with big AIs, or go hard with smaller ones.",
                  },
                  {
                    title: "PLAY",
                    desc: "People play your game, rate it. See where you land on the board.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/20 transition-colors">
                      <span className="text-[var(--primary)] font-bold text-sm">
                        {item.title[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ArcadeCard>

          <div className="grid grid-cols-2 gap-4">
            {tiersWithModels.map((tier, idx) => {
              const isOdd = tiersWithModels.length % 2 !== 0;
              const isLast = idx === tiersWithModels.length - 1;
              const spanTwo = isOdd && isLast;

              return (
                <ArcadeCard
                  key={tier.slug}
                  className={`p-4 ${idx >= 2 ? "border-[var(--accent)]/30" : ""} ${spanTwo ? "col-span-2" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{tier.name}</span>
                    <ArcadeBadge
                      text={tier.multiplier}
                      variant={idx >= 2 ? "neon" : "default"}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {tier.models}
                  </p>
                </ArcadeCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function LearnBento() {
  return (
    <section className="py-6 bg-[var(--card)]/10">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            More Than Just Games
          </span>
          <h2 className="text-4xl md:text-5xl font-black mt-4">
            Get better. Figure stuff out.
          </h2>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-4 md:gap-5 auto-rows-[minmax(100px,auto)]">
          <ArcadeCard className="col-span-6 md:col-span-6 row-span-2 p-6 flex flex-col">
            <div className="flex-1">
              <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                <span className="text-[var(--primary)] text-2xl">🎓</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                You actually get better at this
              </h3>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-6">
                Every prompt teaches you something. The good ones, the flops—all
                of it.
              </p>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Public prompts become case studies. Read what winners wrote, try
                it, learn from it.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-[var(--primary)]">
                    100%
                  </span>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Public winning prompts
                  </p>
                </div>
                <div className="w-px h-10 bg-[var(--border)]" />
                <div>
                  <span className="text-2xl font-bold">∞</span>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Things to learn
                  </p>
                </div>
              </div>
            </div>
          </ArcadeCard>

          <ArcadeCard className="col-span-6 sm:col-span-6 md:col-span-6 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                <span className="text-[var(--accent)] text-xl">⚖️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Compare models head-to-head
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Run the same prompt on GPT, Claude, Deepseek. See who
                  delivers. Build your own benchmarks with real tasks.
                </p>
              </div>
            </div>
          </ArcadeCard>

          <ArcadeCard className="col-span-3 sm:col-span-3 md:col-span-3 p-4 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <span className="text-[var(--primary)]">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Learn from everyone</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Fork winning prompts. Tweak them. Run them elsewhere.
              </p>
            </div>
          </ArcadeCard>

          <ArcadeCard className="col-span-3 sm:col-span-3 md:col-span-3 row-span-3 p-5 bg-gradient-to-br from-[var(--card)] to-[var(--primary)]/5 flex flex-col justify-center">
            <div className="text-center">
              <p className="text-6xl font-black text-[var(--primary)] mb-2">
                1
              </p>
              <p className="text-sm font-bold uppercase tracking-wider">
                Prompt
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                No tricks. Just skill.
              </p>
            </div>
          </ArcadeCard>

          <ArcadeCard className="col-span-6 sm:col-span-7 md:col-span-7 p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <span className="text-yellow-500">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Scoring rewards skill
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Shorter prompts = more points. Harder models = bigger
                  multiplier. Can't game it.
                </p>
              </div>
            </div>
          </ArcadeCard>

          <ArcadeCard
            variant="glow"
            className="col-span-6 sm:col-span-2 md:col-span-2 p-4 flex items-center justify-center"
          >
            <div className="text-center">
              <span className="text-2xl">✨</span>
              <p className="text-xs font-bold uppercase tracking-wider mt-2">
                No BS
              </p>
            </div>
          </ArcadeCard>

          <ArcadeCard className="col-span-6 sm:col-span-9 md:col-span-9 p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                <span className="text-pink-500">❤️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Actually fun</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Not a course. Not homework. Just games, competition, and a
                  reason to keep improving.
                </p>
              </div>
            </div>
          </ArcadeCard>
        </div>
      </div>
    </section>
  );
}

function CreatorCards() {
  return (
    <section className="py-10 border-t border-[var(--border)] synthwave-dark-text">
      <div className="container mx-auto px-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] text-center mb-8 synthwave-dark-text">
          More from me
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <a
            href="https://x.com/DimitriGilbert"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <ArcadeCard className="h-full p-5 hover:border-[var(--primary)]/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center text-lg">
                  𝕏
                </div>
                <div>
                  <p className="font-bold text-sm">Follow on X</p>
                  <p className="text-xs text-[var(--muted-foreground)]">@DimitriGilbert</p>
                </div>
              </div>
            </ArcadeCard>
          </a>
          <a
            href="https://github.com/DimitriGilbert"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <ArcadeCard className="h-full p-5 hover:border-[var(--primary)]/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub">
                    <title>GitHub</title>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm">GitHub</p>
                  <p className="text-xs text-[var(--muted-foreground)]">DimitriGilbert</p>
                </div>
              </div>
            </ArcadeCard>
          </a>
          <a
            href="https://dbuild.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <ArcadeCard className="h-full p-5 hover:border-[var(--primary)]/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center gap-3">
                <Image
                  src="/images/dbuild-og.png"
                  alt="dbuild.dev"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-sm">dbuild.dev</p>
                  <p className="text-xs text-[var(--muted-foreground)]">More projects</p>
                </div>
              </div>
            </ArcadeCard>
          </a>
        </div>
      </div>
    </section>
  );
}

function Outro() {
  return (
    <footer className="py-16 relative synthwave-dark-text">
      <div className="absolute inset-0 opacity-20 home-cta-glow" />
      <div className="max-w-3xl mx-auto px-4 text-center relative">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Wanna try it?</h2>
        <p className="text-lg text-[var(--muted-foreground)] mb-8 synthwave-dark-text">
          Write prompts. Make games. See what happens.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={"/login" as Route}>
            <ArcadeButton variant="glow" size="lg">
              Sign Up
            </ArcadeButton>
          </Link>
          <Link href={"/leaderboard" as Route}>
            <ArcadeButton variant="secondary" size="lg">
              Browse Games
            </ArcadeButton>
          </Link>
        </div>
        <p className="mt-8 text-sm text-[var(--muted-foreground)] synthwave-dark-text">
          Come hang out at{" "}
          <span className="font-bold text-[var(--primary)]">Arcade Vibe</span>.
        </p>
        <nav aria-label="Legal" className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--muted-foreground)]">
          <Link href={"/privacy" as Route} className="transition-colors hover:text-[var(--primary)]">
            Privacy Policy
          </Link>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <Link href={"/terms" as Route} className="transition-colors hover:text-[var(--primary)]">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

async function HomepageData() {
  const homepageData = await getCachedHomepageData();
  return (
    <>
      <QuickStats gamesCount={homepageData.gamesCount} uniqueCreators={homepageData.uniqueCreators} themesCount={homepageData.themesCount} />
      <FeaturedArticle currentTheme={homepageData.currentTheme} leaderboard={homepageData.leaderboard} />
      <FeatureSplit tiersWithModels={homepageData.tiersWithModels} />
    </>
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
        <Suspense fallback={<div className="py-20" />}>
          <HomepageData />
        </Suspense>
        <LearnBento />
        <Outro />
        <CreatorCards />
      </div>
    </main>
  );
}
