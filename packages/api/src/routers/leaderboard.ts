import { router, publicProcedure } from "../index";
import { db } from "@arcade-vibe/db";
import { scores, scoreHistory } from "@arcade-vibe/db/schema/scores";
import { eq, desc, lt, and } from "drizzle-orm";
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

type PaginatedLeaderboardResult = {
  entries: LeaderboardEntry[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const leaderboardRouter = router({
  getTop: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }): Promise<PaginatedLeaderboardResult> => {
      const cacheKey = `lb:${input.themeId}:${input.cursor ?? "first"}:${input.limit}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached) as PaginatedLeaderboardResult & { timestamp: number };
        const cacheAge = (Date.now() - parsed.timestamp) / 1000;
        if (cacheAge < 300) {
          return {
            entries: parsed.entries,
            nextCursor: parsed.nextCursor,
            hasMore: parsed.hasMore,
          };
        }
      }

      const scoresQuery = db.query.scores;
      if (!scoresQuery) {
        throw new Error("Database query not available");
      }

      const fetchLimit = input.limit + 1;
      const whereClause = input.cursor
        ? and(eq(scores.themeId, input.themeId), lt(scores.id, input.cursor))
        : eq(scores.themeId, input.themeId);

      const result = await scoresQuery.findMany({
        where: whereClause,
        orderBy: [desc(scores.score), desc(scores.id)],
        limit: fetchLimit,
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

      const hasMore = result.length > input.limit;
      const entries = hasMore ? result.slice(0, input.limit) : result;
      const nextCursor = hasMore && entries.length > 0 ? entries[entries.length - 1]?.id ?? null : null;

      const response: PaginatedLeaderboardResult = {
        entries: entries as LeaderboardEntry[],
        nextCursor,
        hasMore,
      };

      const cacheValue = JSON.stringify({
        ...response,
        timestamp: Date.now(),
      });
      await redis.setex(cacheKey, 300, cacheValue);

      return response;
    }),

  getScoreHistory: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const history = await db.query.scoreHistory.findMany({
        where: eq(scoreHistory.gameId, input.gameId),
        orderBy: desc(scoreHistory.calculatedAt),
        limit: input.limit,
      });

      return history.map((h) => ({
        id: h.id,
        previousScore: h.previousScore,
        newScore: h.newScore,
        previousComponents: h.previousComponents ? JSON.parse(h.previousComponents) : null,
        newComponents: h.newComponents ? JSON.parse(h.newComponents) : null,
        reason: h.reason,
        calculatedAt: h.calculatedAt,
      }));
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

            const cacheKey = `lb:${input.themeId}:first:20`;
            const cachedWithMeta = await redis.get(cacheKey);

            if (cachedWithMeta) {
              const parsed = JSON.parse(cachedWithMeta) as PaginatedLeaderboardResult & {
                timestamp: number;
              };
              const cacheAge = (Date.now() - parsed.timestamp) / 1000;

              if (cacheAge < 300) {
                yield parsed;
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
              orderBy: [desc(scores.score), desc(scores.id)],
              limit: 20,
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

            const response: PaginatedLeaderboardResult = {
              entries: topGames as LeaderboardEntry[],
              nextCursor: null,
              hasMore: false,
            };

            const cacheValue = JSON.stringify({
              ...response,
              timestamp: Date.now(),
            });
            await redis.setex(cacheKey, 300, cacheValue);
            yield response;
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
