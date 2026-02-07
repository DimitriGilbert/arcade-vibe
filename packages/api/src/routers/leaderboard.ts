import { router, publicProcedure } from "../index";
import { db } from "@arcade-vibe/db";
import { scores } from "@arcade-vibe/db/schema/scores";
import { eq, desc } from "drizzle-orm";
import { cacheGet, cacheSet, redis } from "../lib/redis";
import z from "zod";

export const leaderboardRouter = router({
  /**
   * Get top games for a theme
   * Returns top 100 games ordered by score
   * Results are cached for 5 minutes
   */
  getTop: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(100),
      }),
    )
    .query(async ({ input }) => {
      // Check Redis cache first
      const cacheKey = `lb:${input.themeId}`;
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return cached;
      }

      // Query scores from database
      const scoresQuery = db.query.scores;
      if (!scoresQuery) {
        throw new Error("Database query not available");
      }

      const result = await scoresQuery.findMany({
        where: eq(scores.themeId, input.themeId),
        orderBy: desc(scores.score),
        limit: input.limit,
        with: {
          game: {
            with: {
              prompt: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Cache results for 5 minutes (300 seconds)
      await cacheSet(cacheKey, result, 300);

      return result;
    }),

  /**
   * Subscribe to real-time leaderboard updates
   * Uses Redis Streams for efficient real-time updates
   * Clients receive fresh leaderboard data when new scores are published
   */
  subscribe: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
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
          `leaderboard:${input.themeId}`,
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

          // Try to get cached leaderboard
          const cacheKey = `lb:${input.themeId}`;
          const cached = await cacheGet(cacheKey);

          if (!cached) {
            // Cache not exists, fetch fresh top 100 from database
            const scoresQuery = db.query.scores;
            if (!scoresQuery) {
              continue;
            }

            const topGames = await scoresQuery.findMany({
              where: eq(scores.themeId, input.themeId),
              orderBy: desc(scores.score),
              limit: 100,
              with: {
                game: {
                  with: {
                    prompt: {
                      with: {
                        user: {
                          columns: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            // Cache with 5 minute TTL
            await cacheSet(cacheKey, topGames, 300);
            yield topGames;
          } else {
            // Return cached data
            yield cached;
          }
        }
      }
    }),
});
