import { db } from "@arcade-vibe/db";
import { scores, scoreHistory, scoreRecalculationJobs } from "@arcade-vibe/db/schema/scores";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { games as gamesTable, gameScores } from "@arcade-vibe/db/schema/games";
import { scoringWeights, platformStats } from "@arcade-vibe/db/schema/platform";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { eq, and, desc, gt, inArray } from "drizzle-orm";
import { redis } from "./redis";
import {
  SCORING_CONFIG,
  getPlaytimeBucket,
  type PlaytimeBucket,
  type ScoringConfig,
} from "./scoring-config";

export type { PlaytimeBucket, ScoringConfig };
export { SCORING_CONFIG, getPlaytimeBucket };

interface ScoringWeights {
  quality: number;
  difficulty: number;
  efficiency: number;
  engagement: number;
  popularity: number;
}

interface ScoreComponents {
  qualityScore: number;
  difficultyScore: number;
  efficiencyScore: number;
  engagementScore: number;
  popularityScore: number;
  playtimeBucket: PlaytimeBucket;
}

interface ScoreResult {
  gameId: string;
  finalScore: number;
  components: ScoreComponents;
  weightsUsed: ScoringWeights;
}

interface BatchScoreData {
  tierCostMultipliers: Map<string, number>;
  engagementData: Map<string, { avgPlaytime: number; bucket: PlaytimeBucket }>;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  quality: SCORING_CONFIG.weights.quality,
  difficulty: SCORING_CONFIG.weights.difficulty,
  efficiency: SCORING_CONFIG.weights.efficiency,
  engagement: SCORING_CONFIG.weights.engagement,
  popularity: SCORING_CONFIG.weights.popularity,
};

async function calculateQualityScore(
  gameRatings: Array<{
    overall: number;
    promptQuality: number | null;
    gameQuality: number | null;
    themeRelevance: number | null;
  }>,
  globalAvgRating: number,
  totalRatingCount: number,
): Promise<number> {
  if (gameRatings.length === 0) {
    return 0;
  }

  const { minRatingCount, maxScore, ratingToScoreMultiplier } = SCORING_CONFIG.quality;
  const sumOfRatings = gameRatings.reduce((sum, r) => sum + r.overall, 0);

  const bayesianAvg =
    (totalRatingCount * globalAvgRating + sumOfRatings) /
    (totalRatingCount + minRatingCount);

  const qualityScore = Math.min(bayesianAvg * ratingToScoreMultiplier, maxScore);
  return qualityScore;
}

async function calculateDifficultyScore(
  tierCostId: string,
  batchData?: BatchScoreData,
): Promise<number> {
  const { maxScore, defaultMultiplier } = SCORING_CONFIG.difficulty;

  if (batchData?.tierCostMultipliers.has(tierCostId)) {
    const scoreMultiplier = batchData.tierCostMultipliers.get(tierCostId) ?? defaultMultiplier;
    return Math.min(scoreMultiplier * maxScore, maxScore);
  }

  const tierCost = await db.query.tierCosts.findFirst({
    where: eq(tierCosts.id, tierCostId),
    columns: { scoreMultiplier: true },
  });

  const scoreMultiplier = tierCost?.scoreMultiplier ?? defaultMultiplier;
  const difficultyScore = scoreMultiplier * maxScore;
  return Math.min(difficultyScore, maxScore);
}

function calculateEfficiencyScore(tokenCount: number): number {
  if (tokenCount <= 0) {
    return 0;
  }

  const { maxScore, tokenBaseline } = SCORING_CONFIG.efficiency;
  const efficiencyScore =
    (maxScore * Math.log(tokenBaseline / (tokenCount + 1))) / Math.log(tokenBaseline);
  return Math.max(0, Math.min(efficiencyScore, maxScore));
}

async function calculateEngagementScore(
  gameId: string,
  batchData?: BatchScoreData,
): Promise<{ score: number; bucket: PlaytimeBucket }> {
  const { maxScore, maxPlaytimeSeconds } = SCORING_CONFIG.engagement;

  if (batchData?.engagementData.has(gameId)) {
    const data = batchData.engagementData.get(gameId);
    if (data) {
      const cappedPlaytime = Math.min(data.avgPlaytime, maxPlaytimeSeconds);
      const engagementScore = (maxScore * cappedPlaytime) / maxPlaytimeSeconds;
      return { score: engagementScore, bucket: data.bucket };
    }
  }

  const scores = await db.query.gameScores.findMany({
    where: and(
      eq(gameScores.gameId, gameId),
      gt(gameScores.score, 0),
    ),
    columns: { completionTime: true },
  });

  if (scores.length === 0 || scores.every((s) => s.completionTime === null)) {
    return { score: 0, bucket: getPlaytimeBucket(0) };
  }

  const validTimes = scores
    .map((s) => s.completionTime)
    .filter((t): t is number => t !== null && t !== undefined);
  const avgPlaytime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
  const bucket = getPlaytimeBucket(avgPlaytime);

  const cappedPlaytime = Math.min(avgPlaytime, maxPlaytimeSeconds);
  const engagementScore = (maxScore * cappedPlaytime) / maxPlaytimeSeconds;

  return { score: engagementScore, bucket };
}

function calculatePopularityScore(ratingCount: number): number {
  if (ratingCount <= 0) {
    return 0;
  }

  const { maxScore, logBase } = SCORING_CONFIG.popularity;
  const popularityScore = (maxScore * Math.log(ratingCount + 1)) / Math.log(logBase);

  return Math.min(popularityScore, maxScore);
}

async function fetchScoringWeights(
  themeId?: string | null,
): Promise<ScoringWeights> {
  let weightsRow: typeof scoringWeights.$inferSelect | undefined;

  if (themeId) {
    weightsRow = await db.query.scoringWeights.findFirst({
      where: and(
        eq(scoringWeights.themeId, themeId),
        eq(scoringWeights.isActive, true),
      ),
    });
  }

  if (!weightsRow) {
    return DEFAULT_WEIGHTS;
  }

  return {
    quality: parseFloat(weightsRow.qualityWeight ?? "0.40"),
    difficulty: parseFloat(weightsRow.difficultyWeight ?? "0.25"),
    efficiency: parseFloat(weightsRow.efficiencyWeight ?? "0.20"),
    engagement: parseFloat(weightsRow.engagementWeight ?? "0.10"),
    popularity: parseFloat(weightsRow.popularityWeight ?? "0.05"),
  };
}

async function fetchPlatformStats(): Promise<{
  totalRatings: number;
  averageRating: number;
}> {
  const stats = await db.query.platformStats.findFirst({
    orderBy: desc(platformStats.lastCalculatedAt),
  });

  if (!stats) {
    return {
      totalRatings: 0,
      averageRating: 0,
    };
  }

  const totalRatings = stats.totalRatings;
  const averageRating = parseFloat(stats.averageRating) || 0;

  return { totalRatings, averageRating };
}

async function fetchBatchData(gameIds: string[], tierCostIds: string[]): Promise<BatchScoreData> {
  const tierCostMultipliers = new Map<string, number>();
  const engagementData = new Map<string, { avgPlaytime: number; bucket: PlaytimeBucket }>();

  if (tierCostIds.length > 0) {
    const tierCostRows = await db
      .select({ id: tierCosts.id, scoreMultiplier: tierCosts.scoreMultiplier })
      .from(tierCosts)
      .where(inArray(tierCosts.id, tierCostIds));

    for (const row of tierCostRows) {
      tierCostMultipliers.set(
        row.id,
        row.scoreMultiplier ?? SCORING_CONFIG.difficulty.defaultMultiplier,
      );
    }
  }

  if (gameIds.length > 0) {
    const gameScoreRows = await db
      .select({
        gameId: gameScores.gameId,
        completionTime: gameScores.completionTime,
      })
      .from(gameScores)
      .where(and(
        inArray(gameScores.gameId, gameIds),
        gt(gameScores.score, 0),
      ));

    const scoresByGame = new Map<string, number[]>();
    for (const row of gameScoreRows) {
      if (row.completionTime !== null) {
        const existing = scoresByGame.get(row.gameId) ?? [];
        existing.push(row.completionTime);
        scoresByGame.set(row.gameId, existing);
      }
    }

    for (const [gameId, times] of scoresByGame) {
      const avgPlaytime = times.reduce((sum, t) => sum + t, 0) / times.length;
      engagementData.set(gameId, {
        avgPlaytime,
        bucket: getPlaytimeBucket(avgPlaytime),
      });
    }
  }

  return { tierCostMultipliers, engagementData };
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
      promptQuality: true,
      gameQuality: true,
      themeRelevance: true,
    },
  });

  const { totalRatings, averageRating } = await fetchPlatformStats();
  const weights = await fetchScoringWeights(game.themeId);

  const qualityScore = await calculateQualityScore(
    gameRatings,
    averageRating,
    totalRatings,
  );

  const difficultyScore = await calculateDifficultyScore(game.tierCostId, batchData);

  const efficiencyScore = calculateEfficiencyScore(game.prompt.tokenCount);

  const { score: engagementScore, bucket: playtimeBucket } = await calculateEngagementScore(gameId, batchData);

  const popularityScore = calculatePopularityScore(gameRatings.length);

  const finalScore =
    qualityScore * weights.quality +
    difficultyScore * weights.difficulty +
    efficiencyScore * weights.efficiency +
    engagementScore * weights.engagement +
    popularityScore * weights.popularity;

  const result: ScoreResult = {
    gameId,
    finalScore: Math.round(finalScore * 100) / 100,
    components: {
      qualityScore,
      difficultyScore,
      efficiencyScore,
      engagementScore,
      popularityScore,
      playtimeBucket,
    },
    weightsUsed: weights,
  };

  await updateGameScore(gameId, result);

  return result;
}

export async function updateGameScore(
  gameId: string,
  scoreResult: ScoreResult,
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
        bayesianRating: scoreResult.components.qualityScore.toFixed(2),
        difficultyMultiplier: scoreResult.components.difficultyScore.toFixed(2),
        brevityScore: scoreResult.components.efficiencyScore.toFixed(2),
        engagementScore: scoreResult.components.engagementScore.toFixed(2),
        popularityScore: scoreResult.components.popularityScore.toFixed(2),
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
        qualityScore: parseFloat(existingScore.bayesianRating ?? "0"),
        difficultyScore: parseFloat(existingScore.difficultyMultiplier ?? "0"),
        efficiencyScore: parseFloat(existingScore.brevityScore ?? "0"),
        engagementScore: parseFloat(existingScore.engagementScore ?? "0"),
        popularityScore: parseFloat(existingScore.popularityScore ?? "0"),
        playtimeBucket: getPlaytimeBucket(0),
      },
      scoreResult.components,
      "recalculation",
    );
  } else {
    const [inserted] = await db
      .insert(scores)
      .values({
        userId: game.prompt.authorId,
        promptId: game.prompt.id,
        gameId: gameId,
        themeId: game.themeId,
        score: roundedScore,
        isHighScore: false,
        completionTime: null,
        playedAt: new Date(),
        finalScore: scoreResult.finalScore.toFixed(2),
        bayesianRating: scoreResult.components.qualityScore.toFixed(2),
        difficultyMultiplier: scoreResult.components.difficultyScore.toFixed(2),
        brevityScore: scoreResult.components.efficiencyScore.toFixed(2),
        engagementScore: scoreResult.components.engagementScore.toFixed(2),
        popularityScore: scoreResult.components.popularityScore.toFixed(2),
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
        "initial",
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
    "difficultyScore",
    score.components.difficultyScore.toString(),
    "efficiencyScore",
    score.components.efficiencyScore.toString(),
    "engagementScore",
    score.components.engagementScore.toString(),
    "popularityScore",
    score.components.popularityScore.toString(),
    "playtimeBucket",
    score.components.playtimeBucket,
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

export type { ScoreResult, ScoreComponents, ScoringWeights };
