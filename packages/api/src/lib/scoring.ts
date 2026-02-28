import { db } from "@arcade-vibe/db";
import { scores, scoreHistory, scoreRecalculationJobs } from "@arcade-vibe/db/schema/scores";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { games as gamesTable, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { platformStats } from "@arcade-vibe/db/schema/platform";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { eq, desc, inArray, and, isNotNull } from "drizzle-orm";
import { redis } from "./redis";
import { SCORING_CONFIG, type ScoringConfig } from "./scoring-config";

export type { ScoringConfig };
export { SCORING_CONFIG };

interface ScoreComponents {
  qualityScore: number;
  engagementScore: number;
  playersScore: number;
  playsScore: number;
  replayScore: number;
  efficiencyScore: number;
  tierFactor: number;
}

interface ScoreResult {
  gameId: string;
  finalScore: number;
  components: ScoreComponents;
}

interface GameplayMetrics {
  uniquePlayers: number;
  totalPlays: number;
  totalValidMinutes: number;
  repeatSessions: number;
  p75Playtime: number;
}

interface BatchScoreData {
  tierCostMultipliers: Map<string, number>;
  gameplayMetrics: Map<string, GameplayMetrics>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];

  if (lowerValue === undefined || upperValue === undefined) {
    return sorted[sorted.length - 1] ?? 0;
  }

  if (lower === upper) {
    return lowerValue;
  }

  const weight = index - lower;
  return lowerValue * (1 - weight) + upperValue * weight;
}

async function fetchPlatformAverageRating(): Promise<number> {
  const stats = await db.query.platformStats.findFirst({
    orderBy: desc(platformStats.lastCalculatedAt),
  });

  const parsed = stats ? parseFloat(stats.averageRating) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 3;
}

async function fetchBatchData(gameIds: string[], tierCostIds: string[]): Promise<BatchScoreData> {
  const tierCostMultipliers = new Map<string, number>();
  const gameplayMetrics = new Map<string, GameplayMetrics>();

  if (tierCostIds.length > 0) {
    const tierCostRows = await db
      .select({ id: tierCosts.id, scoreMultiplier: tierCosts.scoreMultiplier })
      .from(tierCosts)
      .where(inArray(tierCosts.id, tierCostIds));

    for (const row of tierCostRows) {
      tierCostMultipliers.set(row.id, row.scoreMultiplier ?? 1);
    }
  }

  if (gameIds.length > 0) {
    const rows = await db
      .select({
        gameId: gameSessionMetrics.gameId,
        userId: gameSessionMetrics.userId,
        playtimeSeconds: gameSessionMetrics.playtimeSeconds,
      })
      .from(gameSessionMetrics)
      .where(and(
        inArray(gameSessionMetrics.gameId, gameIds),
        isNotNull(gameSessionMetrics.endedAt),
      ));

    const grouped = new Map<string, {
      players: Set<string>;
      times: number[];
      playCountsByUser: Map<string, number>;
      totalValidMinutes: number;
    }>();

    for (const row of rows) {
      const existing = grouped.get(row.gameId) ?? {
        players: new Set<string>(),
        times: [],
        playCountsByUser: new Map<string, number>(),
        totalValidMinutes: 0,
      };
      existing.players.add(row.userId);
      existing.times.push(Math.max(0, row.playtimeSeconds));
      const userPlayCount = existing.playCountsByUser.get(row.userId) ?? 0;
      existing.playCountsByUser.set(row.userId, userPlayCount + 1);
      const boundedSeconds = clamp(
        Math.max(0, row.playtimeSeconds),
        0,
        SCORING_CONFIG.time.maxCountedSecondsPerSession,
      );
      if (boundedSeconds >= SCORING_CONFIG.time.minimumCountedSeconds) {
        existing.totalValidMinutes += boundedSeconds / 60;
      }
      grouped.set(row.gameId, existing);
    }

    for (const [gameId, data] of grouped) {
      const totalPlays = data.times.length;
      const uniquePlayers = data.players.size;
      let repeatSessions = 0;
      for (const plays of data.playCountsByUser.values()) {
        repeatSessions += Math.max(plays - 1, 0);
      }
      const p75Playtime = percentile(data.times, 0.75);

      gameplayMetrics.set(gameId, {
        uniquePlayers,
        totalPlays,
        totalValidMinutes: data.totalValidMinutes,
        repeatSessions,
        p75Playtime,
      });
    }
  }

  return { tierCostMultipliers, gameplayMetrics };
}

async function getGameplayMetrics(
  gameId: string,
  batchData?: BatchScoreData,
): Promise<GameplayMetrics> {
  const cached = batchData?.gameplayMetrics.get(gameId);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      userId: gameSessionMetrics.userId,
      playtimeSeconds: gameSessionMetrics.playtimeSeconds,
    })
    .from(gameSessionMetrics)
    .where(and(
      eq(gameSessionMetrics.gameId, gameId),
      isNotNull(gameSessionMetrics.endedAt),
    ));

  if (rows.length === 0) {
    return {
      uniquePlayers: 0,
      totalPlays: 0,
      totalValidMinutes: 0,
      repeatSessions: 0,
      p75Playtime: 0,
    };
  }

  const players = new Set<string>();
  const times: number[] = [];
  const playCountsByUser = new Map<string, number>();
  let totalValidMinutes = 0;

  for (const row of rows) {
    players.add(row.userId);
    const boundedSeconds = clamp(
      Math.max(0, row.playtimeSeconds),
      0,
      SCORING_CONFIG.time.maxCountedSecondsPerSession,
    );
    times.push(boundedSeconds);
    const userPlayCount = playCountsByUser.get(row.userId) ?? 0;
    playCountsByUser.set(row.userId, userPlayCount + 1);
    if (boundedSeconds >= SCORING_CONFIG.time.minimumCountedSeconds) {
      totalValidMinutes += boundedSeconds / 60;
    }
  }

  const totalPlays = times.length;
  let repeatSessions = 0;
  for (const plays of playCountsByUser.values()) {
    repeatSessions += Math.max(plays - 1, 0);
  }

  return {
    uniquePlayers: players.size,
    totalPlays,
    totalValidMinutes,
    repeatSessions,
    p75Playtime: percentile(times, 0.75),
  };
}

async function recordScoreHistory(
  gameId: string,
  scoreId: string,
  previousScore: string | null,
  newScore: string,
  previousComponents: ScoreComponents | null,
  newComponents: ScoreComponents,
  reason: string,
): Promise<void> {
  await db.insert(scoreHistory).values({
    gameId,
    scoreId,
    previousScore,
    newScore,
    previousComponents: previousComponents ? JSON.stringify(previousComponents) : null,
    newComponents: JSON.stringify(newComponents),
    reason,
  });
}

export async function calculateGameScore(
  gameId: string,
  batchData?: BatchScoreData,
): Promise<ScoreResult | null> {
  const game = await db.query.games.findFirst({
    where: eq(gamesTable.id, gameId),
    with: {
      prompt: {
        columns: {
          tokenCount: true,
        },
      },
      tierCost: {
        columns: {
          id: true,
          scoreMultiplier: true,
        },
      },
    },
  });

  if (!game) {
    return null;
  }

  const gameRatings = await db.query.ratings.findMany({
    where: eq(ratings.gameId, gameId),
    columns: {
      overall: true,
    },
  });

  const globalAverageRating = await fetchPlatformAverageRating();
  const n = gameRatings.length;
  const avgRating =
    n === 0 ? 0 : gameRatings.reduce((sum, row) => sum + row.overall, 0) / n;

  const bayes =
    (SCORING_CONFIG.bayesian.priorRatingCount * globalAverageRating + n * avgRating) /
    (SCORING_CONFIG.bayesian.priorRatingCount + n);
  const confidence = clamp(1 - Math.exp(-n / SCORING_CONFIG.bayesian.confidenceScale), 0, 1);
  const qualitySignal = clamp((bayes - 3) / 2, -1, 1) * confidence;
  const qualityMultiplier =
    n === 0
      ? 1
      : clamp(
          1 + qualitySignal * SCORING_CONFIG.quality.multiplierScale,
          SCORING_CONFIG.quality.minMultiplier,
          SCORING_CONFIG.quality.maxMultiplier,
        );

  const gameplay = await getGameplayMetrics(gameId, batchData);
  const p75Normalized =
    clamp(
      gameplay.p75Playtime / SCORING_CONFIG.time.maxCountedSecondsPerSession,
      0,
      1,
    );
  const timeSignal = Math.log1p(gameplay.totalValidMinutes);
  const baseArcadePoints =
    SCORING_CONFIG.time.pointsPerLogUnit * timeSignal * (0.8 + 0.2 * p75Normalized);

  const reachMultiplier = clamp(
    1 + SCORING_CONFIG.reach.log10Scale * Math.log10(1 + gameplay.uniquePlayers),
    SCORING_CONFIG.reach.minMultiplier,
    SCORING_CONFIG.reach.maxMultiplier,
  );

  const replayPerPlayer =
    gameplay.uniquePlayers === 0
      ? 0
      : gameplay.repeatSessions / gameplay.uniquePlayers;
  const replayBonus =
    SCORING_CONFIG.replay.pointsPerRepeat * Math.log1p(gameplay.repeatSessions) +
    SCORING_CONFIG.replay.pointsPerReplayRatio * replayPerPlayer;

  const inputTokens = game.inputTokens ?? game.prompt.tokenCount ?? 0;
  const tokenOverage = Math.max(inputTokens - SCORING_CONFIG.efficiency.baselineInputTokens, 0);
  const tokenUndershoot = Math.max(SCORING_CONFIG.efficiency.baselineInputTokens - inputTokens, 0);
  const penaltyRatio = clamp(
    Math.log1p(tokenOverage) / Math.log1p(SCORING_CONFIG.efficiency.maxPenaltyInputTokens),
    0,
    1,
  );
  const bonusRatio = clamp(tokenUndershoot / SCORING_CONFIG.efficiency.baselineInputTokens, 0, 1);
  const efficiencyAdjustment =
    SCORING_CONFIG.efficiency.maxBonusPoints * bonusRatio -
    SCORING_CONFIG.efficiency.maxPenaltyPoints * penaltyRatio;

  const tierMultiplier = batchData?.tierCostMultipliers.get(game.tierCostId)
    ?? game.tierCost.scoreMultiplier
    ?? 1;
  const tierFactor = clamp(
    1 + SCORING_CONFIG.tier.scale * (tierMultiplier - 1),
    SCORING_CONFIG.tier.minFactor,
    SCORING_CONFIG.tier.maxFactor,
  );

  const multipliedScore = baseArcadePoints * qualityMultiplier * reachMultiplier * tierFactor;
  const finalScore = Math.round(Math.max(0, multipliedScore + replayBonus + efficiencyAdjustment) * 100) / 100;

  const result: ScoreResult = {
    gameId,
    finalScore,
    components: {
      qualityScore: qualityMultiplier,
      engagementScore: timeSignal,
      playersScore: reachMultiplier,
      playsScore: baseArcadePoints / 100,
      replayScore: replayBonus / 100,
      efficiencyScore: efficiencyAdjustment / 100,
      tierFactor,
    },
  };

  await updateGameScore(gameId, result, inputTokens);

  return result;
}

export async function updateGameScore(
  gameId: string,
  scoreResult: ScoreResult,
  inputTokens: number,
): Promise<void> {
  const game = await db.query.games.findFirst({
    where: eq(gamesTable.id, gameId),
    with: {
      prompt: {
        columns: {
          id: true,
          authorId: true,
        },
      },
    },
  });

  if (!game || !game.prompt) {
    return;
  }

  const existingScore = await db.query.scores.findFirst({
    where: eq(scores.gameId, gameId),
  });

  const roundedScore = Math.round(scoreResult.finalScore);

  if (existingScore) {
    await db
      .update(scores)
      .set({
        score: roundedScore,
        finalScore: scoreResult.finalScore.toFixed(2),
        qualityScore: scoreResult.components.qualityScore.toFixed(4),
        engagementScore: scoreResult.components.engagementScore.toFixed(4),
        playersScore: scoreResult.components.playersScore.toFixed(4),
        playsScore: scoreResult.components.playsScore.toFixed(4),
        replayScore: scoreResult.components.replayScore.toFixed(4),
        efficiencyScore: scoreResult.components.efficiencyScore.toFixed(4),
        tierFactor: scoreResult.components.tierFactor.toFixed(4),
        inputTokens,
        calculatedAt: new Date(),
        version: existingScore.version + 1,
      })
      .where(eq(scores.id, existingScore.id));

    await recordScoreHistory(
      gameId,
      existingScore.id,
      existingScore.finalScore,
      scoreResult.finalScore.toFixed(2),
      {
        qualityScore: parseFloat(existingScore.qualityScore ?? "0"),
        engagementScore: parseFloat(existingScore.engagementScore ?? "0"),
        playersScore: parseFloat(existingScore.playersScore ?? "0"),
        playsScore: parseFloat(existingScore.playsScore ?? "0"),
        replayScore: parseFloat(existingScore.replayScore ?? "0"),
        efficiencyScore: parseFloat(existingScore.efficiencyScore ?? "0"),
        tierFactor: parseFloat(existingScore.tierFactor ?? "1"),
      },
      scoreResult.components,
      "recalculation_v3",
    );
  } else {
    const [inserted] = await db
      .insert(scores)
      .values({
        userId: game.prompt.authorId,
        promptId: game.prompt.id,
        gameId,
        themeId: game.themeId,
        score: roundedScore,
        isHighScore: false,
        completionTime: null,
        playedAt: new Date(),
        finalScore: scoreResult.finalScore.toFixed(2),
        qualityScore: scoreResult.components.qualityScore.toFixed(4),
        engagementScore: scoreResult.components.engagementScore.toFixed(4),
        playersScore: scoreResult.components.playersScore.toFixed(4),
        playsScore: scoreResult.components.playsScore.toFixed(4),
        replayScore: scoreResult.components.replayScore.toFixed(4),
        efficiencyScore: scoreResult.components.efficiencyScore.toFixed(4),
        tierFactor: scoreResult.components.tierFactor.toFixed(4),
        inputTokens,
      })
      .returning({ id: scores.id });

    if (inserted) {
      await recordScoreHistory(
        gameId,
        inserted.id,
        null,
        scoreResult.finalScore.toFixed(2),
        null,
        scoreResult.components,
        "initial_v3",
      );
    }
  }
}

export async function publishScoreUpdate(
  gameId: string,
  score: ScoreResult,
): Promise<void> {
  const game = await db.query.games.findFirst({
    where: eq(gamesTable.id, gameId),
    columns: {
      themeId: true,
    },
  });

  if (!game || !game.themeId) {
    return;
  }

  const streamKey = `leaderboard:${game.themeId}`;

  await redis.xadd(
    streamKey,
    "*",
    "gameId",
    gameId,
    "finalScore",
    score.finalScore.toString(),
    "qualityScore",
    score.components.qualityScore.toString(),
    "engagementScore",
    score.components.engagementScore.toString(),
    "playersScore",
    score.components.playersScore.toString(),
    "playsScore",
    score.components.playsScore.toString(),
    "replayScore",
    score.components.replayScore.toString(),
    "efficiencyScore",
    score.components.efficiencyScore.toString(),
    "tierFactor",
    score.components.tierFactor.toString(),
    "timestamp",
    Date.now().toString(),
  );

  console.log(
    `Published score update for game ${gameId} to stream ${streamKey}`,
  );
}

export async function calculateAndPublishScore(
  gameId: string,
  batchData?: BatchScoreData,
): Promise<ScoreResult | null> {
  const scoreResult = await calculateGameScore(gameId, batchData);

  if (!scoreResult) {
    return null;
  }

  await publishScoreUpdate(gameId, scoreResult);

  return scoreResult;
}

export async function recalculateAllScores(): Promise<{
  totalGames: number;
  successful: number;
  failed: number;
  failedGameIds: string[];
}> {
  console.log("Starting score recalculation for all games...");

  const allGames = await db.query.games.findMany({
    columns: {
      id: true,
      tierCostId: true,
    },
  });

  const totalGames = allGames.length;
  let successful = 0;
  let failed = 0;
  const failedGameIds: string[] = [];

  const gameIds = allGames.map((g) => g.id);
  const tierCostIds = [...new Set(allGames.map((g) => g.tierCostId))];

  const batchData = await fetchBatchData(gameIds, tierCostIds);

  const { batchSize, delayBetweenBatchesMs } = SCORING_CONFIG.recalculation;

  for (let i = 0; i < allGames.length; i += batchSize) {
    const batch = allGames.slice(i, i + batchSize);

    for (const game of batch) {
      try {
        const scoreResult = await calculateAndPublishScore(game.id, batchData);
        if (scoreResult) {
          successful++;
          console.log(
            `[${successful}/${totalGames}] Game ${game.id}: ${scoreResult.finalScore}`,
          );
        } else {
          failed++;
          failedGameIds.push(game.id);
          console.error(`Failed to calculate score for game ${game.id}`);
        }
      } catch (error) {
        failed++;
        failedGameIds.push(game.id);
        console.error(`Error calculating score for game ${game.id}:`, error);
      }
    }

    if (i + batchSize < allGames.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs));
    }
  }

  console.log("\nScore recalculation complete:");
  console.log(`  Total games: ${totalGames}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);

  if (failedGameIds.length > 0) {
    console.log(`  Failed game IDs: ${failedGameIds.join(", ")}`);
  }

  return {
    totalGames,
    successful,
    failed,
    failedGameIds,
  };
}

export async function createScheduledRecalculationJob(): Promise<string> {
  const [job] = await db
    .insert(scoreRecalculationJobs)
    .values({
      status: "pending",
      totalGames: 0,
      processedGames: 0,
      failedGames: 0,
    })
    .returning({ id: scoreRecalculationJobs.id });

  if (!job) {
    throw new Error("Failed to create recalculation job");
  }

  return job.id;
}

export async function runScheduledRecalculation(jobId: string): Promise<{
  success: boolean;
  processedGames: number;
  failedGames: number;
}> {
  const job = await db.query.scoreRecalculationJobs.findFirst({
    where: eq(scoreRecalculationJobs.id, jobId),
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  await db
    .update(scoreRecalculationJobs)
    .set({
      status: "running",
      startedAt: new Date(),
    })
    .where(eq(scoreRecalculationJobs.id, jobId));

  try {
    const allGames = await db.query.games.findMany({
      columns: {
        id: true,
        tierCostId: true,
      },
    });

    await db
      .update(scoreRecalculationJobs)
      .set({ totalGames: allGames.length })
      .where(eq(scoreRecalculationJobs.id, jobId));

    const gameIds = allGames.map((g) => g.id);
    const tierCostIds = [...new Set(allGames.map((g) => g.tierCostId))];
    const batchData = await fetchBatchData(gameIds, tierCostIds);

    const { batchSize, delayBetweenBatchesMs } = SCORING_CONFIG.recalculation;
    let processedGames = 0;
    let failedGames = 0;

    for (let i = 0; i < allGames.length; i += batchSize) {
      const batch = allGames.slice(i, i + batchSize);

      for (const game of batch) {
        try {
          await calculateAndPublishScore(game.id, batchData);
          processedGames++;
        } catch {
          failedGames++;
        }
      }

      await db
        .update(scoreRecalculationJobs)
        .set({ processedGames, failedGames })
        .where(eq(scoreRecalculationJobs.id, jobId));

      if (i + batchSize < allGames.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs));
      }
    }

    await db
      .update(scoreRecalculationJobs)
      .set({
        status: "completed",
        processedGames,
        failedGames,
        completedAt: new Date(),
      })
      .where(eq(scoreRecalculationJobs.id, jobId));

    return { success: true, processedGames, failedGames };
  } catch (error) {
    await db
      .update(scoreRecalculationJobs)
      .set({
        status: "failed",
        completedAt: new Date(),
      })
      .where(eq(scoreRecalculationJobs.id, jobId));

    throw error;
  }
}

export async function getScoreHistory(
  gameId: string,
  limit = 50,
): Promise<Array<{
  id: string;
  previousScore: string | null;
  newScore: string;
  reason: string;
  calculatedAt: Date;
}>> {
  const history = await db.query.scoreHistory.findMany({
    where: eq(scoreHistory.gameId, gameId),
    orderBy: desc(scoreHistory.calculatedAt),
    limit,
  });

  return history.map((h) => ({
    id: h.id,
    previousScore: h.previousScore,
    newScore: h.newScore,
    reason: h.reason,
    calculatedAt: h.calculatedAt,
  }));
}

export type { ScoreResult, ScoreComponents };
