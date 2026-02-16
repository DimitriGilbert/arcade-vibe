import { router, publicProcedure } from "../index";
import { db } from "@arcade-vibe/db";
import { scores } from "@arcade-vibe/db/schema/scores";
import { eq, desc } from "drizzle-orm";
import { redis } from "../lib/redis";
import z from "zod";

type LeaderboardEntry = {
  id: string;
  userId: string;
  promptId: string;
  gameId: string;
  themeId: string | null;
  score: number;
  isHighScore: boolean;
  completionTime: number | null;
  playedAt: Date;
  bayesianRating: string | null;
  difficultyMultiplier: string | null;
  brevityScore: string | null;
  engagementScore: string | null;
  popularityScore: string | null;
  finalScore: string;
  calculatedAt: Date;
  version: number;
  game: {
    id: string;
    name: string | null;
    promptId: string;
    themeId: string | null;
    prompt: {
      id: string;
      user: {
        id: string;
        name: string | null;
      };
    };
  };
};

export const leaderboardRouter = router({
  getTop: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(100),
      }),
    )
    .query(async ({ input }) => {
      const cacheKey = `lb:${input.themeId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached) as { data: LeaderboardEntry[]; timestamp: number };
        const cacheAge = (Date.now() - parsed.timestamp) / 1000;
        if (cacheAge < 300) {
          return parsed.data;
        }
      }

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

      const cacheValue = JSON.stringify({
        data: result,
        timestamp: Date.now(),
      });
      await redis.setex(cacheKey, 300, cacheValue);

      return result;
    }),

  subscribe: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
      }),
    )
    .subscription(async function* ({ input }) {
      let lastId = "$";
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 5;

      while (true) {
        try {
          const results = await redis.xread(
            "BLOCK",
            5000,
            "STREAMS",
            `leaderboard:${input.themeId}`,
            lastId,
          );

          if (results) {
            const entries = results[0]?.[1];
            if (entries) {
              for (const [entryId] of entries) {
                lastId = entryId;
              }
            }

            const cacheKey = `lb:${input.themeId}`;
            const cachedWithMeta = await redis.get(cacheKey);

            if (cachedWithMeta) {
              const parsed = JSON.parse(cachedWithMeta) as {
                data: LeaderboardEntry[];
                timestamp: number;
              };
              const cacheAge = (Date.now() - parsed.timestamp) / 1000;

              if (cacheAge < 300) {
                yield parsed.data;
                consecutiveErrors = 0;
                continue;
              }
            }

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

            const cacheValue = JSON.stringify({
              data: topGames,
              timestamp: Date.now(),
            });
            await redis.setex(cacheKey, 300, cacheValue);
            yield topGames;
            consecutiveErrors = 0;
          }
        } catch (error) {
          consecutiveErrors++;
          console.error(
            `[Leaderboard Subscription] Error for theme ${input.themeId}:`,
            error,
          );

          yield {
            error: true,
            message: "Failed to fetch leaderboard update",
          };

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error(
              `[Leaderboard Subscription] Max consecutive errors reached (${MAX_CONSECUTIVE_ERRORS}), terminating subscription for theme ${input.themeId}`,
            );
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }),
});
