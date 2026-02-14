import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { games, gameScores } from "@arcade-vibe/db/schema/games";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { cacheDeletePattern } from "@arcade-vibe/api/lib/redis";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "../middleware/rate-limit";

export const ratingsRouter = router({
  create: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        gameId: z.string().uuid(),
        promptId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        playtime: z.number().int().min(0).optional(),
        feedback: z.string().optional(),
        promptQuality: z.number().int().min(1).max(5).optional(),
        gameQuality: z.number().int().min(1).max(5).optional(),
        themeRelevance: z.number().int().min(1).max(5).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify playtime >= 60s if provided
      if (input.playtime !== undefined && input.playtime < 60) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum playtime of 60 seconds required to rate",
        });
      }

      // Verify the game exists and get themeId
      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      // Check if user already rated this game/prompt combination
      const existingRating = await db.query.ratings.findFirst({
        where: and(
          eq(ratings.userId, ctx.user.id),
          eq(ratings.gameId, input.gameId),
          eq(ratings.promptId, input.promptId),
        ),
      });

      if (existingRating) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already rated this game",
        });
      }

      // Verify the user has played this game for at least 60 seconds
      const userScore = await db.query.gameScores.findFirst({
        where: and(
          eq(gameScores.userId, ctx.user.id),
          eq(gameScores.gameId, input.gameId),
        ),
      });

      if (!userScore) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must play the game before rating it",
        });
      }

      const actualPlaytime = userScore.completionTime || 0;
      if (actualPlaytime < 60 && (input.playtime || 0) < 60) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum playtime of 60 seconds required to rate",
        });
      }

      // Insert the rating
      const newRating = await db
        .insert(ratings)
        .values({
          userId: ctx.user.id,
          gameId: input.gameId,
          promptId: input.promptId,
          themeId: game.themeId,
          overall: input.rating,
          feedback: input.feedback,
          promptQuality: input.promptQuality,
          gameQuality: input.gameQuality,
          themeRelevance: input.themeRelevance,
        })
        .returning();

      // Invalidate game cache
      await cacheDeletePattern(`game:*:${input.gameId}`);
      await cacheDeletePattern(`ratings:*:${input.gameId}`);

      // Trigger score recalculation (delete game score cache for now)
      await cacheDeletePattern(`game_leaderboard:${input.gameId}`);
      await cacheDeletePattern(`lb:*`);

      return {
        success: true,
        ratingId: newRating[0]?.id,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        ratingId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        playtime: z.number().int().min(0).optional(),
        feedback: z.string().optional(),
        promptQuality: z.number().int().min(1).max(5).optional(),
        gameQuality: z.number().int().min(1).max(5).optional(),
        themeRelevance: z.number().int().min(1).max(5).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch existing rating
      const existingRating = await db.query.ratings.findFirst({
        where: eq(ratings.id, input.ratingId),
      });

      if (!existingRating) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rating not found",
        });
      }

      // Verify rating belongs to user
      if (existingRating.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own ratings",
        });
      }

      // Verify playtime if provided
      if (input.playtime !== undefined && input.playtime < 60) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Playtime cannot be less than 60 seconds",
        });
      }

      // Update the rating
      const updatedRating = await db
        .update(ratings)
        .set({
          overall: input.rating,
          feedback: input.feedback,
          promptQuality: input.promptQuality,
          gameQuality: input.gameQuality,
          themeRelevance: input.themeRelevance,
        })
        .where(eq(ratings.id, input.ratingId))
        .returning();

      // Invalidate caches
      await cacheDeletePattern(`game:*:${existingRating.gameId}`);
      await cacheDeletePattern(`ratings:*:${existingRating.gameId}`);
      await cacheDeletePattern(`game_leaderboard:${existingRating.gameId}`);
      await cacheDeletePattern(`lb:*`);

      return {
        success: true,
        ratingId: updatedRating[0]?.id,
      };
    }),

  getByGame: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().max(100).default(50),
        offset: z.number().int().default(0),
      }),
    )
    .query(async ({ input }) => {
      const ratingsQuery = db.query.ratings;
      if (!ratingsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const gameRatings = await ratingsQuery.findMany({
        where: eq(ratings.gameId, input.gameId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(ratings.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return gameRatings;
    }),

  getByUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ratingsQuery = db.query.ratings;
      if (!ratingsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      if (input.userId && input.userId !== ctx.user.id) {
        const isAdmin =
          ctx.user.role === "admin" || ctx.user.role === "moderator";
        if (!isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own ratings",
          });
        }
      }

      const targetUserId = input.userId || ctx.user.id;

      if (!targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User ID required",
        });
      }

      const userRatings = await ratingsQuery.findMany({
        where: eq(ratings.userId, targetUserId),
        with: {
          game: {
            columns: {
              id: true,
              name: true,
              status: true,
              imageUrl: true,
            },
          },
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(ratings.createdAt)],
      });

      return userRatings;
    }),

  getMyRating: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        promptId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ratingsQuery = db.query.ratings;
      if (!ratingsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const myRating = await ratingsQuery.findFirst({
        where: and(
          eq(ratings.userId, ctx.user.id),
          eq(ratings.gameId, input.gameId),
          eq(ratings.promptId, input.promptId),
        ),
      });

      return myRating || null;
    }),
});
