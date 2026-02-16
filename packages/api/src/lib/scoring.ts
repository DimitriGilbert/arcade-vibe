import { db } from "@arcade-vibe/db";
import { scores } from "@arcade-vibe/db/schema/scores";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { games as gamesTable, gameScores } from "@arcade-vibe/db/schema/games";
import { scoringWeights, platformStats } from "@arcade-vibe/db/schema/platform";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { eq, and, desc, gt } from "drizzle-orm";
import { redis } from "./redis";

/**
 * Scoring Engine - Calculates game scores based on multiple factors
 * per PRD 04-ui-components.md - Scoring Algorithm section
 */

// Type definitions
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
}

interface ScoreResult {
  gameId: string;
  finalScore: number;
  components: ScoreComponents;
  weightsUsed: {
    quality: number;
    difficulty: number;
    efficiency: number;
    engagement: number;
    popularity: number;
  };
}

// Default scoring weights (percentages as decimals)
const DEFAULT_WEIGHTS = {
  quality: 0.4, // 40%
  difficulty: 0.25, // 25%
  efficiency: 0.2, // 20%
  engagement: 0.1, // 10%
  popularity: 0.05, // 5%
};

/**
 * Calculate Quality Score (40% of max)
 * Bayesian average rating: (totalRatingCount × globalAvgRating + sumOfRatings) / (totalRatingCount + minRatingCount)
 * Capped at 20 points (40% of 50 max)
 *
 * Note: ratingWeights are fetched and available for future use in more complex rating aggregation
 * The current implementation uses the overall rating directly per PRD requirements
 */
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

  const sumOfRatings = gameRatings.reduce((sum, r) => sum + r.overall, 0);
  const minRatingCount = 10; // Minimum ratings to consider

  // Bayesian average
  const bayesianAvg =
    (totalRatingCount * globalAvgRating + sumOfRatings) /
    (totalRatingCount + minRatingCount);

  // Scale to 0-20 range (max rating is 5, so multiply by 4)
  const qualityScore = Math.min(bayesianAvg * 4, 20);
  return qualityScore;
}

/**
 * Calculate Difficulty Score (25% of max)
 * Based on tier cost's scoreMultiplier from the database
 * Formula: scoreMultiplier × 20
 * Capped at 20 points
 */
async function calculateDifficultyScore(tierCostId: string): Promise<number> {
  // Fetch the tier cost to get the score multiplier
  const tierCost = await db.query.tierCosts.findFirst({
    where: eq(tierCosts.id, tierCostId),
    columns: { scoreMultiplier: true },
  });

  // Use 1.0 as fallback if tier cost record not found
  const scoreMultiplier = tierCost?.scoreMultiplier ?? 1.0;
  const difficultyScore = scoreMultiplier * 20;
  return Math.min(difficultyScore, 20);
}

/**
 * Calculate Efficiency Score (20% of max)
 * Brevity bonus (logarithmic)
 * Formula: 20 × log(1000 / (tokens + 1)) / log(1000)
 * Capped at 20 points
 */
function calculateEfficiencyScore(tokenCount: number): number {
  if (tokenCount <= 0) {
    return 0;
  }

  const efficiencyScore =
    (20 * Math.log(1000 / (tokenCount + 1))) / Math.log(1000);
  return Math.max(0, Math.min(efficiencyScore, 20));
}

/**
 * Calculate Engagement Score (10% of max)
 * Average playtime (capped at 5min = 300s)
 * Formula: 20 × min(avgPlaytime, 300) / 300
 * Capped at 20 points
 */
async function calculateEngagementScore(gameId: string): Promise<number> {
  const scores = await db.query.gameScores.findMany({
    where: and(
      eq(gameScores.gameId, gameId),
      gt(gameScores.score, 0),
    ),
    columns: { completionTime: true },
  });

  if (scores.length === 0 || scores.every((s) => s.completionTime === null)) {
    return 0;
  }

  const validTimes = scores
    .map((s) => s.completionTime)
    .filter((t) => t !== null && t !== undefined) as number[];
  const avgPlaytime =
    validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;

  const cappedPlaytime = Math.min(avgPlaytime, 300);
  const engagementScore = (20 * cappedPlaytime) / 300;

  return engagementScore;
}

/**
 * Calculate Popularity Score (5% of max)
 * Vote volume (number of ratings)
 * Formula: 20 × log(ratingCount + 1) / log(100)
 * Capped at 20 points
 */
function calculatePopularityScore(ratingCount: number): number {
  if (ratingCount <= 0) {
    return 0;
  }

  const popularityScore = (20 * Math.log(ratingCount + 1)) / Math.log(100);

  return Math.min(popularityScore, 20);
}

/**
 * Fetch scoring weights from database or use defaults
 */
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
    // Use defaults if no theme-specific weights found
    return DEFAULT_WEIGHTS;
  }

  // Map database decimal fields to numbers for calculation
  return {
    quality: parseFloat(weightsRow.qualityWeight ?? "0.40"),
    difficulty: parseFloat(weightsRow.difficultyWeight ?? "0.25"),
    efficiency: parseFloat(weightsRow.efficiencyWeight ?? "0.20"),
    engagement: parseFloat(weightsRow.engagementWeight ?? "0.10"),
    popularity: parseFloat(weightsRow.popularityWeight ?? "0.05"),
  };
}

/**
 * Fetch platform stats for global averages
 */
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

/**
 * Calculate the final score for a single game
 */
export async function calculateGameScore(
  gameId: string,
): Promise<ScoreResult | null> {
  // Fetch game with prompt, theme, and tier cost information
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

  // Fetch ratings for this game
  const gameRatings = await db.query.ratings.findMany({
    where: eq(ratings.gameId, gameId),
    columns: {
      overall: true,
      promptQuality: true,
      gameQuality: true,
      themeRelevance: true,
    },
  });

  // Fetch platform stats
  const { totalRatings, averageRating } = await fetchPlatformStats();

  // Fetch scoring weights
  const weights = await fetchScoringWeights(game.themeId);

  // Calculate component scores
  const qualityScore = await calculateQualityScore(
    gameRatings,
    averageRating,
    totalRatings,
  );

  // Use tierCostId from the game record
  const difficultyScore = await calculateDifficultyScore(game.tierCostId);

  const efficiencyScore = calculateEfficiencyScore(game.prompt.tokenCount);

  const engagementScore = await calculateEngagementScore(gameId);

  const popularityScore = calculatePopularityScore(gameRatings.length);

  // Apply weighted scoring using fetched weights
  const finalScore =
    qualityScore * weights.quality +
    difficultyScore * weights.difficulty +
    efficiencyScore * weights.efficiency +
    engagementScore * weights.engagement +
    popularityScore * weights.popularity;

  const result: ScoreResult = {
    gameId,
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    components: {
      qualityScore,
      difficultyScore,
      efficiencyScore,
      engagementScore,
      popularityScore,
    },
    weightsUsed: weights,
  };

  // Persist the score to the database
  await updateGameScore(gameId, result);

  return result;
}

/**
 * Update or insert score for a game in the scores table
 * This is called after calculating the game score
 */
export async function updateGameScore(
  gameId: string,
  scoreResult: ScoreResult,
): Promise<void> {
  // Fetch game with prompt information to get promptId and authorId
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

  // Check if score already exists for this game
  const existingScore = await db.query.scores.findFirst({
    where: eq(scores.gameId, gameId),
  });

  const roundedScore = Math.round(scoreResult.finalScore);

  if (existingScore) {
    // Update existing score
    await db
      .update(scores)
      .set({
        score: roundedScore,
      })
      .where(eq(scores.id, existingScore.id));
  } else {
    // Insert new score using the prompt's author as the userId
    await db.insert(scores).values({
      userId: game.prompt.authorId,
      promptId: game.prompt.id,
      gameId: gameId,
      themeId: game.themeId,
      score: roundedScore,
      isHighScore: false,
      completionTime: null,
      playedAt: new Date(),
      finalScore: scoreResult.finalScore.toString(),
    });
  }
}

/**
 * Publish score update to Redis Stream for leaderboard update
 */
export async function publishScoreUpdate(
  gameId: string,
  score: ScoreResult,
): Promise<void> {
  // Get the themeId for this game
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

  // Publish to Redis Stream
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
    "timestamp",
    Date.now().toString(),
  );

  console.log(
    `Published score update for game ${gameId} to stream ${streamKey}`,
  );
}

/**
 * Calculate score for a game and publish to Redis
 */
export async function calculateAndPublishScore(
  gameId: string,
): Promise<ScoreResult | null> {
  const scoreResult = await calculateGameScore(gameId);

  if (!scoreResult) {
    return null;
  }

  // Publish to Redis Stream
  await publishScoreUpdate(gameId, scoreResult);

  return scoreResult;
}

/**
 * Recalculate scores for all games
 * Can be run as a cron job or manually
 */
export async function recalculateAllScores(): Promise<{
  totalGames: number;
  successful: number;
  failed: number;
  failedGameIds: string[];
}> {
  console.log("Starting score recalculation for all games...");

  // Fetch all games
  const allGames = await db.query.games.findMany({
    columns: {
      id: true,
    },
  });

  const totalGames = allGames.length;
  let successful = 0;
  let failed = 0;
  const failedGameIds: string[] = [];

  for (const game of allGames) {
    try {
      const scoreResult = await calculateAndPublishScore(game.id);
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
