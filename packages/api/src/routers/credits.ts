import { router, protectedProcedure, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { creditTransactions } from "@arcade-vibe/db/schema/credits";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  addCreditsInternal,
  getCreditBreakdown,
  type CreditSourceType,
} from "../lib/credits";

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
      reputation: user.reputation,
      credits: user.credits,
      isSuspended: user.isSuspended,
      suspensionReason: user.suspensionReason,
    };
  }),

  // Get user's current credit balance with expiry breakdown
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const breakdown = await getCreditBreakdown(ctx.user.id);

    return {
      balance: breakdown.total,
      breakdown: {
        expiringWithin7Days: breakdown.expiringWithin7Days,
        expiringWithin30Days: breakdown.expiringWithin30Days,
        validBeyond30Days: breakdown.validBeyond30Days,
      },
    };
  }),

  // Get detailed credit breakdown by batch
  getCreditBreakdown: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    return getCreditBreakdown(ctx.user.id);
  }),

  // Get user's credit transaction history
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z
          .enum(["all", "purchase", "deduction", "expiry", "grant"])
          .optional(),
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

      // Filter by type if specified
      const filtered =
        input.type && input.type !== "all"
          ? transactions.filter((t) => t.type === input.type)
          : transactions;

      return {
        transactions: filtered.map((t) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          expiresAt: t.expiresAt,
          createdAt: t.createdAt,
        })),
        count: filtered.length,
      };
    }),

  // Get credits expiring soon
  getExpiringCredits: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const breakdown = await getCreditBreakdown(ctx.user.id);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringBatches = breakdown.batches.filter(
      (b) => b.daysUntilExpiry <= 30,
    );

    return {
      totalExpiringWithin30Days: breakdown.expiringWithin30Days,
      totalExpiringWithin7Days: breakdown.expiringWithin7Days,
      batches: expiringBatches.map((b) => ({
        id: b.id,
        remainingAmount: b.remainingAmount,
        sourceType: b.sourceType,
        expiresAt: b.expiresAt,
        daysUntilExpiry: b.daysUntilExpiry,
      })),
    };
  }),

  // Admin-only: Add credits to user's balance
  addCredits: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().int().positive(),
        reason: z.string().min(1).max(100),
        sourceType: z
          .enum([
            "one_time_purchase",
            "subscription",
            "admin_grant",
            "free_trial",
          ])
          .optional(),
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
        (input.sourceType as CreditSourceType) ?? "admin_grant",
        description,
      );

      return {
        success: true,
        newBalance,
      };
    }),
});
