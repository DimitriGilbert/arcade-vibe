import type { Metadata, Route } from "next";
import Link from "next/link";
import { Trophy, Calendar, Gamepad2, TrendingUp } from "lucide-react";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import type { LeaderboardEntry, ThemeList } from "@/lib/trpc-types";
import {
  CoverStoryCard,
  CompactLeaderboardRow,
  ThemeHero,
  MagazineThemeSelector,
} from "@/components/leaderboard/magazine";
import { db } from "@arcade-vibe/db";
import { themes } from "@arcade-vibe/db/schema/themes";
import { games, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { user } from "@arcade-vibe/db/schema/auth";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { scores } from "@arcade-vibe/db/schema/scores";
import { eq, and, desc, sql, isNull, isNotNull, count, sum } from "drizzle-orm";
import type { ThemeMediaConfig } from "@arcade-vibe/db/schema/media-types";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 250;

function serializeDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function serializeThemeFromRow(theme: {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mediaConfig: ThemeMediaConfig | null;
}): ThemeList {
  return {
    ...theme,
    status: theme.status as ThemeList["status"],
    visibility: theme.visibility as ThemeList["visibility"],
    startDate: serializeDate(theme.startDate),
    endDate: serializeDate(theme.endDate),
    createdAt: theme.createdAt.toISOString(),
    updatedAt: theme.updatedAt.toISOString(),
  };
}

type RawLeaderboardRow = {
  gameId: string;
  gameName: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  isSubmitted: boolean;
  finalScore: string;
  calculatedAt: Date | null;
  qualityScore: string | null;
  engagementScore: string | null;
  playersScore: string | null;
  playsScore: string | null;
  replayScore: string | null;
  efficiencyScore: string | null;
  tierFactor: string | null;
  inputTokens: number | null;
  modelProvider: string;
  modelName: string;
  modelId: string | null;
  tierSlug: string | null;
  tierName: string | null;
  creatorId: string;
  creatorName: string | null;
  themeId: string | null;
  themeTitle: string | null;
  promptId: string;
  promptVisibility: string | null;
};

function serializeLeaderboardEntry(entry: RawLeaderboardRow & {
  playCount: number;
  totalPlayTimeSeconds: number;
}): LeaderboardEntry {
  return {
    gameId: entry.gameId,
    gameName: entry.gameName,
    createdAt: entry.createdAt.toISOString(),
    submittedAt: serializeDate(entry.submittedAt),
    isSubmitted: entry.isSubmitted,
    finalScore: entry.finalScore,
    calculatedAt: serializeDate(entry.calculatedAt),
    modelProvider: entry.modelProvider,
    modelName: entry.modelName,
    modelId: entry.modelId,
    tier: entry.tierSlug && entry.tierName
      ? {
          slug: entry.tierSlug,
          name: entry.tierName,
        }
      : null,
    creator: {
      id: entry.creatorId,
      name: entry.creatorName,
    },
    theme: entry.themeId
      ? {
          id: entry.themeId,
          title: entry.themeTitle,
        }
      : null,
    promptId: entry.promptId,
    promptVisibility: entry.promptVisibility ?? "private",
    playCount: entry.playCount,
    totalPlayTimeSeconds: entry.totalPlayTimeSeconds,
    scoreBreakdown: {
      qualityScore: entry.qualityScore,
      engagementScore: entry.engagementScore,
      playersScore: entry.playersScore,
      playsScore: entry.playsScore,
      replayScore: entry.replayScore,
      efficiencyScore: entry.efficiencyScore,
      tierFactor: entry.tierFactor,
      inputTokens: entry.inputTokens,
    },
  };
}

interface LeaderboardMagazinePageProps {
  searchParams?: Promise<{
    themeId?: string;
    limit?: string;
  }>;
}

async function getAllThemes() {
  const allThemes = await db.query.themes.findMany({
    orderBy: [desc(themes.createdAt)],
  });

  return allThemes.map(serializeThemeFromRow);
}

async function getCurrentTheme() {
  const now = new Date();
  const currentTheme = await db.query.themes.findFirst({
    where: and(
      eq(themes.status, "active"),
      sql`${themes.startDate} <= ${now} AND ${themes.endDate} >= ${now}`,
    ),
  });

  if (currentTheme) {
    return serializeThemeFromRow(currentTheme);
  }

  const freeTheme = await db.query.themes.findFirst({
    where: eq(themes.isPermanent, true),
  });

  return freeTheme ? serializeThemeFromRow(freeTheme) : null;
}

async function getThemeById(themeId: string) {
  const theme = await db.query.themes.findFirst({
    where: eq(themes.id, themeId),
  });

  return theme ? serializeThemeFromRow(theme) : null;
}

async function getLeaderboardEntries(themeId: string, limit: number) {
  const fetchLimit = limit + 1;

  const conditions = [
    isNull(games.deletedAt),
    eq(games.isHidden, false),
    eq(games.status, "completed"),
    eq(games.isSubmitted, true),
    eq(games.themeId, themeId),
  ];

  const result = await db
    .select({
      gameId: games.id,
      gameName: games.name,
      createdAt: games.createdAt,
      submittedAt: games.submittedAt,
      isSubmitted: games.isSubmitted,
      finalScore: sql<string>`COALESCE(${scores.finalScore}, '0')`,
      calculatedAt: scores.calculatedAt,
      qualityScore: scores.qualityScore,
      engagementScore: scores.engagementScore,
      playersScore: scores.playersScore,
      playsScore: scores.playsScore,
      replayScore: scores.replayScore,
      efficiencyScore: scores.efficiencyScore,
      tierFactor: scores.tierFactor,
      inputTokens: scores.inputTokens,
      modelProvider: games.modelProvider,
      modelName: games.modelName,
      modelId: modelConfig.id,
      tierSlug: tierCosts.slug,
      tierName: tierCosts.name,
      creatorId: user.id,
      creatorName: user.name,
      themeId: themes.id,
      themeTitle: themes.title,
      promptId: prompts.id,
      promptVisibility: prompts.visibility,
    })
    .from(games)
    .innerJoin(prompts, eq(games.promptId, prompts.id))
    .innerJoin(user, eq(prompts.authorId, user.id))
    .innerJoin(tierCosts, eq(games.tierCostId, tierCosts.id))
    .leftJoin(themes, eq(games.themeId, themes.id))
    .leftJoin(scores, eq(games.id, scores.gameId))
    .leftJoin(modelConfig, eq(games.modelName, modelConfig.modelName))
    .where(and(...conditions))
    .orderBy(desc(sql`COALESCE(${scores.finalScore}::numeric, 0)`), desc(games.createdAt))
    .limit(fetchLimit);

  const gameIds = result.map((r) => r.gameId);

  const playStats = gameIds.length > 0
    ? await db
        .select({
          gameId: gameSessionMetrics.gameId,
          playCount: count(),
          totalPlayTime: sum(gameSessionMetrics.playtimeSeconds),
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
    playStats.map((s) => [
      s.gameId,
      {
        playCount: Number(s.playCount ?? 0),
        totalPlayTimeSeconds: Number(s.totalPlayTime ?? 0),
      },
    ]),
  );

  const hasMore = result.length > limit;
  const rows = hasMore ? result.slice(0, limit) : result;

  const entries = rows.map((row) => {
    const stats = playStatsMap.get(row.gameId) ?? {
      playCount: 0,
      totalPlayTimeSeconds: 0,
    };

    return serializeLeaderboardEntry({
      ...row,
      playCount: stats.playCount,
      totalPlayTimeSeconds: stats.totalPlayTimeSeconds,
    });
  });

  return { entries, hasMore };
}

export async function generateMetadata({
  searchParams,
}: LeaderboardMagazinePageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;

  let currentTheme: ThemeList | null = null;
  if (resolvedSearchParams?.themeId) {
    currentTheme = await getThemeById(resolvedSearchParams.themeId);
  } else {
    currentTheme = await getCurrentTheme();
  }

  if (!currentTheme) {
    return {
      title: "Leaderboard - Arcade Vibe",
      description: "See who's making waves this month",
    };
  }

  const canonicalUrl = new URL("/leaderboard/magazine", "http://placeholder.local");
  canonicalUrl.searchParams.set("themeId", currentTheme.id);

  return {
    title: `Leaderboard - ${currentTheme.title} | Arcade Vibe`,
    description: `Check out the top games in ${currentTheme.title}. Who's crushing it this month?`,
    alternates: {
      canonical: canonicalUrl.pathname + canonicalUrl.search,
    },
    openGraph: {
      title: `${currentTheme.title} Leaderboard - Arcade Vibe`,
      description: currentTheme.description || `Top games in ${currentTheme.title}`,
      url: canonicalUrl.pathname + canonicalUrl.search,
    },
  };
}

export default async function LeaderboardMagazinePage({
  searchParams,
}: LeaderboardMagazinePageProps) {
  const resolvedSearchParams = await searchParams;
  const allThemes = await getAllThemes();

  let currentTheme: ThemeList | null = null;
  if (resolvedSearchParams?.themeId) {
    currentTheme = allThemes.find((t) => t.id === resolvedSearchParams.themeId) ?? null;
    if (!currentTheme) {
      currentTheme = await getThemeById(resolvedSearchParams.themeId);
    }
  }
  if (!currentTheme) {
    currentTheme = await getCurrentTheme();
  }

  const parsedLimit = Number(resolvedSearchParams?.limit ?? DEFAULT_PAGE_SIZE);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.floor(parsedLimit), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  let leaderboardResult: { entries: LeaderboardEntry[]; hasMore: boolean } | null = null;
  if (currentTheme) {
    leaderboardResult = await getLeaderboardEntries(currentTheme.id, limit);
  }

  const entries = leaderboardResult?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const nextParams = new URLSearchParams();
  if (currentTheme?.id) {
    nextParams.set("themeId", currentTheme.id);
  }
  nextParams.set("limit", String(Math.min(limit + DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)));
  const loadMoreHref = `/leaderboard/magazine?${nextParams.toString()}` as Route;

  if (!currentTheme) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto">
          <ArcadeCard className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
            <h1 className="text-2xl font-bold mb-4">No Active Theme</h1>
            <p className="text-[var(--muted-foreground)] mb-8">Check back for the next theme.</p>
            <Link href="/creator/ide">
              <ArcadeButton variant="primary">
                <Gamepad2 className="h-4 w-4" />
                Browse Games
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 md:px-6">
      <div className="container mx-auto space-y-12">
        <ThemeHero
          title={currentTheme.title}
          description={currentTheme.description}
          endDate={currentTheme.endDate}
          entryCount={entries.length}
          themeSelector={
            allThemes.length > 1 ? (
              <MagazineThemeSelector
                currentTheme={currentTheme}
                themes={allThemes}
              />
            ) : null
          }
        />

        {entries.length === 0 ? (
          <ArcadeCard className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">No Games Yet</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              Be the first to submit a game for this theme.
            </p>
            <Link href="/creator/ide">
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
                <h2 className="text-2xl font-bold">Top 3</h2>
              </div>

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
                  <h2 className="text-xl font-bold">Rankings</h2>
                </div>

                <ArcadeCard>
                  <div className="max-h-[600px] overflow-auto">
                    <div className="divide-y divide-[var(--border)]">
                      {rest.map((entry, idx) => (
                        <CompactLeaderboardRow key={entry.gameId} entry={entry} rank={idx + 4} />
                      ))}
                    </div>
                  </div>
                </ArcadeCard>

                {leaderboardResult?.hasMore && limit < MAX_PAGE_SIZE && (
                  <div className="flex justify-center mt-6">
                    <Link href={loadMoreHref}>
                      <ArcadeButton variant="outline">
                        Load More
                      </ArcadeButton>
                    </Link>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <section className="pb-12">
          <ArcadeCard className="p-8 text-center bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
            <h3 className="text-xl font-bold mb-3">Create a Game</h3>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              Write a prompt, pick your AI model, and generate a game.
            </p>
            <Link href="/creator/ide">
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
