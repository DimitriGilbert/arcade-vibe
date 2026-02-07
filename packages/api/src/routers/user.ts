import { router, protectedProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { user } from "@arcade-vibe/db/schema/auth";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * User Router
 *
 * Provides user-specific operations:
 * - updateProfile: Update user's name
 */
export const userRouter = router({
  updateProfile: protectedProcedure
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
          email: user.email,
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
