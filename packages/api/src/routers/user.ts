import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { user } from "@arcade-vibe/db/schema/auth";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "@arcade-vibe/api/middleware/rate-limit";

/**
 * User Router
 *
 * Provides user-specific operations:
 * - getByName: Get user by name (public, no email exposed)
 * - updateProfile: Update user's name
 */
export const userRouter = router({
  getByName: publicProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const result = await db.query.user.findFirst({
        where: eq(user.name, input.name),
        columns: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return result;
    }),
  updateProfile: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        name: z.string().min(2).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Update user name
      const result = await db
        .update(user)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.user.id))
        .returning({
          id: user.id,
          name: user.name,
          image: user.image,
        });

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        success: true,
        user: result[0],
      };
    }),
});
