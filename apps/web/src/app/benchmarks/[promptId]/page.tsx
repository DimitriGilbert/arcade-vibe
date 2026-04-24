import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";

import { db } from "@arcade-vibe/db";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { games, gameScores, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { scores } from "@arcade-vibe/db/schema/scores";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import {
  eq,
  desc,
  or,
  and,
  isNull,
  isNotNull,
  sql,
  inArray,
  count,
} from "drizzle-orm";

import BenchmarkView from "@/components/benchmark-view";

interface BenchmarkPageProps {
  params: Promise<{ promptId: string }>;
}

async function getBenchmarkData(promptId: string) {
  const prompt = await db.query.prompts.findFirst({
    where: eq(prompts.id, promptId),
    with: {
      user: { columns: { name: true, image: true } },
      theme: { columns: { title: true } },
    },
  });

  if (!prompt || !prompt.isBenchmark) return null;

  const rootPromptId = prompt.parentId ?? prompt.id;

  const allVersions = await db.query.prompts.findMany({
    where: or(
      eq(prompts.id, rootPromptId),
      eq(prompts.parentId, rootPromptId),
    ),
    columns: { id: true },
  });

  const promptIds = allVersions.map((p) => p.id);

  if (promptIds.length === 0) {
    return {
      prompt: {
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        authorName: prompt.user?.name ?? null,
        authorImage: prompt.user?.image ?? null,
        themeTitle: prompt.theme?.title ?? null,
      },
      games: [],
    };
  }

  const result = await db
    .select({
      id: games.id,
      name: games.name,
      modelName: games.modelName,
      modelProvider: games.modelProvider,
      status: games.status,
      imageUrl: games.imageUrl,
      tierCostId: games.tierCostId,
      inputTokens: games.inputTokens,
      outputTokens: games.outputTokens,
      reasoningTokens: games.reasoningTokens,
      tokenUsage: games.tokenUsage,
      generationTimeMs: games.generationTimeMs,
      timeToFirstTokenMs: games.timeToFirstTokenMs,
      tokensPerSecond: games.tokensPerSecond,
      requestCostUsd: games.requestCostUsd,
      isSubmitted: games.isSubmitted,
      createdAt: games.createdAt,
      finalScore: scores.finalScore,
      tierSlug: tierCosts.slug,
      tierName: tierCosts.name,
      tierColorClass: tierCosts.colorClass,
    })
    .from(games)
    .leftJoin(scores, eq(games.id, scores.gameId))
    .innerJoin(tierCosts, eq(games.tierCostId, tierCosts.id))
    .where(
      and(
        inArray(games.promptId, promptIds),
        isNull(games.deletedAt),
        sql`${games.status} != 'generating'`,
      ),
    )
    .orderBy(desc(games.createdAt));

  const gameIds = result.map((g) => g.id);

  const [playStats, ratingsData, highScores] = await Promise.all([
    gameIds.length > 0
      ? db
          .select({
            gameId: gameSessionMetrics.gameId,
            totalPlays: count(),
            uniquePlayers: count(
              sql`DISTINCT ${gameSessionMetrics.userId}`,
            ),
          })
          .from(gameSessionMetrics)
          .where(
            and(
              inArray(gameSessionMetrics.gameId, gameIds),
              isNotNull(gameSessionMetrics.endedAt),
            ),
          )
          .groupBy(gameSessionMetrics.gameId)
      : [],
    gameIds.length > 0
      ? db
          .select({
            gameId: ratings.gameId,
            avgOverall: sql<string>`AVG(${ratings.overall})::numeric`,
            ratingCount: count(),
          })
          .from(ratings)
          .where(inArray(ratings.gameId, gameIds))
          .groupBy(ratings.gameId)
      : [],
    gameIds.length > 0
      ? db
          .select({
            gameId: gameScores.gameId,
            highScore: sql<number>`MAX(${gameScores.score})`,
          })
          .from(gameScores)
          .where(
            and(
              inArray(gameScores.gameId, gameIds),
              eq(gameScores.isHighScore, true),
            ),
          )
          .groupBy(gameScores.gameId)
      : [],
  ]);

  const playStatsMap = new Map(
    playStats.map((s) => [
      s.gameId,
      { totalPlays: Number(s.totalPlays), uniquePlayers: Number(s.uniquePlayers) },
    ]),
  );

  const ratingsMap = new Map(
    ratingsData.map((r) => [
      r.gameId,
      {
        avgRating: r.avgOverall ? Number(r.avgOverall) : null,
        ratingCount: Number(r.ratingCount),
      },
    ]),
  );

  const highScoresMap = new Map(
    highScores.map((h) => [h.gameId, Number(h.highScore)]),
  );

  const benchmarkGames = result.map((game) => {
    const stats = playStatsMap.get(game.id) ?? {
      totalPlays: 0,
      uniquePlayers: 0,
    };
    const rating = ratingsMap.get(game.id) ?? {
      avgRating: null as number | null,
      ratingCount: 0,
    };

    return {
      id: game.id,
      name: game.name,
      modelName: game.modelName,
      modelProvider: game.modelProvider,
      status: game.status,
      imageUrl: game.imageUrl,
      tierSlug: game.tierSlug,
      tierName: game.tierName,
      tierColorClass: game.tierColorClass,
      inputTokens: game.inputTokens,
      outputTokens: game.outputTokens,
      reasoningTokens: game.reasoningTokens,
      tokenUsage: game.tokenUsage,
      generationTimeMs: game.generationTimeMs,
      timeToFirstTokenMs: game.timeToFirstTokenMs,
      tokensPerSecond: game.tokensPerSecond,
      requestCostUsd: game.requestCostUsd,
      isSubmitted: game.isSubmitted,
      createdAt: game.createdAt.toISOString(),
      finalScore: game.finalScore,
      totalPlays: stats.totalPlays,
      uniquePlayers: stats.uniquePlayers,
      avgRating: rating.avgRating,
      ratingCount: rating.ratingCount,
      highScore: highScoresMap.get(game.id) ?? null,
    };
  });

  return {
    prompt: {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      authorName: prompt.user?.name ?? null,
      authorImage: prompt.user?.image ?? null,
      themeTitle: prompt.theme?.title ?? null,
    },
    games: benchmarkGames,
  };
}

export async function generateMetadata({
  params,
}: BenchmarkPageProps): Promise<Metadata> {
  const { promptId } = await params;
  try {
    const data = await getBenchmarkData(promptId);
    if (!data) return { title: "Benchmark" };
    return {
      title: `${data.prompt.title ?? "Benchmark"} — Benchmark`,
      description: `Comparing ${data.games.length} AI game generations across models`,
      openGraph: {
        title: `${data.prompt.title ?? "Benchmark"} — Benchmark`,
        description: `Comparing ${data.games.length} AI game generations across models`,
      },
    };
  } catch {
    return { title: "Benchmark" };
  }
}

export default async function BenchmarkPage({ params }: BenchmarkPageProps) {
  const { promptId } = await params;
  const getCachedBenchmark = unstable_cache(
    () => getBenchmarkData(promptId),
    [`benchmark-${promptId}`],
    { tags: [`benchmark-${promptId}`], revalidate: 300 },
  );
  const data = await getCachedBenchmark();
  if (!data) notFound();
  return <BenchmarkView data={data} />;
}
