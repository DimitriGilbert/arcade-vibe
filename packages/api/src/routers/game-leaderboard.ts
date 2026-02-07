import { router, publicProcedure } from "../index";
import { db } from "@arcade-vibe/db";
import { gameScores } from "@arcade-vibe/db/schema/games";
import { eq, desc, asc, count, max, avg, countDistinct } from "drizzle-orm";
import { cacheGet, cacheSet } from "../lib/redis";
import { redis } from "../lib/redis";
import z from "zod";

export const gameLeaderboardRouter = router({
  /**
   * Get leaderboard for a specific game
   * Returns top scores with user information
   * Results are cached for 1 minute
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      // Check Redis cache first
      const cacheKey = `game_leaderboard:${input.gameId}`;
      const cached = await cacheGet<typeof result>(cacheKey);
      if (cached) {
        return cached;
      }

      // Query gameScores from database
      const gameScoresQuery = db.query.gameScores;
      if (!gameScoresQuery) {
        throw new Error("Database query not available");
      }

      const result = await gameScoresQuery.findMany({
        where: eq(gameScores.gameId, input.gameId),
        orderBy: [desc(gameScores.score), asc(gameScores.playedAt)],
        limit: input.limit,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Cache results for 1 minute
      await cacheSet(cacheKey, result, 60);

      return result;
    }),

  /**
   * Get game statistics
   * Returns aggregated stats: totalPlays, highScore, avgScore, avgPlaytime, uniquePlayers
   */
  getStats: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const stats = await db
        .select({
          totalPlays: count(),
          highScore: max(gameScores.score),
          avgScore: avg(gameScores.score),
          avgPlaytime: avg(gameScores.completionTime),
          uniquePlayers: countDistinct(gameScores.userId),
        })
        .from(gameScores)
        .where(eq(gameScores.gameId, input.gameId));

      return stats[0] ?? null;
    }),

  /**
   * Subscribe to real-time leaderboard updates
   * Uses Redis Streams for efficient real-time updates
   * Clients receive fresh leaderboard data when new scores are submitted
   */
  subscribe: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
      }),
    )
    .subscription(async function* ({ input }) {
      let lastId = "$";

      while (true) {
        // Read from Redis Stream, blocking for 5 seconds
        const results = await redis.xread(
          "BLOCK",
          5000,
          "STREAMS",
          `game_scores:${input.gameId}`,
          lastId,
        );

        if (results) {
          // Update lastId from new entries
          const entries = results[0]?.[1];
          if (entries) {
            for (const [entryId] of entries) {
              lastId = entryId;
            }
          }

          // Fetch fresh leaderboard from database
          const gameScoresQuery = db.query.gameScores;
          if (!gameScoresQuery) {
            continue;
          }

          const leaderboard = await gameScoresQuery.findMany({
            where: eq(gameScores.gameId, input.gameId),
            orderBy: [desc(gameScores.score), asc(gameScores.playedAt)],
            limit: 50,
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          yield leaderboard;
        }
      }
    }),
});
