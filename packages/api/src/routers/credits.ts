import { router, protectedProcedure, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { creditTransactions } from "@arcade-vibe/db/schema/credits";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { addCreditsInternal } from "../lib/credits";

export const creditsRouter = router({
  // Get user's extended data (including reputation)
  getUserExtended: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const user = await db.query.userExtended.findFirst({
      where: eq(userExtended.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      role: user.role,
      reputation: parseInt(user.reputation, 10),
      credits: parseInt(user.credits, 10),
      isSuspended: user.isSuspended,
      suspensionReason: user.suspensionReason,
    };
  }),

  // Get user's current credit balance
  // per PRD lines 2198-2245: Pricing & Credits system
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const user = await db.query.userExtended.findFirst({
      where: eq(userExtended.id, ctx.user.id),
      columns: {
        credits: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const balance = parseInt(user.credits, 10);
    return {
      balance: isNaN(balance) ? 0 : balance,
    };
  }),

  // Get user's credit transaction history
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const transactions = await db.query.creditTransactions.findMany({
        where: eq(creditTransactions.userId, ctx.user.id),
        orderBy: [desc(creditTransactions.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return {
        transactions,
        count: transactions.length,
      };
    }),

  // Admin-only: Add credits to user's balance
  addCredits: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().int().positive(),
        reason: z.string().min(1).max(100),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Verify target user exists
      const targetUser = await db.query.userExtended.findFirst({
        where: eq(userExtended.id, input.userId),
        columns: { id: true, credits: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found",
        });
      }

      // Use internal helper to add credits
      const description = input.metadata
        ? `${input.reason} ${JSON.stringify(input.metadata)}`
        : input.reason;

      const newBalance = await addCreditsInternal(
        input.userId,
        input.amount,
        input.reason,
        "admin_grant",
        description,
      );

      return {
        success: true,
        newBalance,
      };
    }),
});
