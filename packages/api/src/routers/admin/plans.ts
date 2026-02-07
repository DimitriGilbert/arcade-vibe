import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { subscriptionPlans } from "@arcade-vibe/db/schema/credits";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Subscription Plans Router
 *
 * PRD Reference: Lines 1491-1569 (Subscription Plan Management)
 *
 * Admin procedures for managing subscription plans:
 * - getPlans: List all plans ordered by price
 * - updatePlan: Update plan pricing and configuration
 * - togglePlanActive: Activate/deactivate plan
 *
 * SCHEMA DISCREPANCIES:
 * The subscriptionPlans schema does not include all fields expected by the PRD:
 *
 * PRD Fields → Schema Mapping:
 * - priceUsd → price (integer, cents-based)
 * - creditsPerMonth → credits (integer)
 * - displayName → name (text)
 * - features → features (text array) ✓
 * - description → NOT IN SCHEMA
 * - isActive → isActive (boolean) ✓
 * - extraCreditMarkupPercent → NOT IN SCHEMA
 * - minExtraCreditsPurchase → NOT IN SCHEMA
 */

export const plansRouter = router({
  /**
   * Get Plans
   *
   * PRD Lines: 1499-1506
   *
   * List all subscription plans ordered by price (ascending).
   * Returns all plan fields from the schema.
   */
  getPlans: adminProcedure.query(async () => {
    const plans = await db.query.subscriptionPlans.findMany({
      orderBy: [asc(subscriptionPlans.price)],
    });

    return plans;
  }),

  /**
   * Update Plan
   *
   * PRD Lines: 1508-1542
   *
   * Update subscription plan pricing and configuration.
   * - Updates price (in cents) and credits
   * - Logs old vs new values in adminActions metadata
   *
   * Schema field mappings:
   * - priceUsd → price (integer, stored as cents)
   * - creditsPerMonth → credits (integer)
   */
  updatePlan: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        price: z.number().int().min(0),
        credits: z.number().int().min(0),
        features: z.array(z.string()).optional(),
        stripePriceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify plan exists
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, input.id),
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription plan not found",
        });
      }

      // PRD lines 1517-1525: Track old vs new values for logging
      const oldValues = {
        price: plan.price,
        credits: plan.credits,
        features: plan.features,
        stripePriceId: plan.stripePriceId,
      };

      const newValues = {
        price: input.price,
        credits: input.credits,
        features: input.features ?? plan.features,
        stripePriceId: input.stripePriceId,
      };

      // PRD lines 1527-1534: Update plan configuration
      await db
        .update(subscriptionPlans)
        .set({
          price: input.price,
          credits: input.credits,
          features: input.features,
          stripePriceId: input.stripePriceId,
        })
        .where(eq(subscriptionPlans.id, input.id));

      // PRD lines 1536-1542: Log to adminActions with before/after metadata
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "update_plan",
        targetType: "plan",
        targetId: input.id,
        reason: `Updated plan configuration`,
        metadata: JSON.stringify({
          oldValues,
          newValues,
        }),
      });

      return {
        success: true,
        planId: input.id,
        oldValues,
        newValues,
      };
    }),

  /**
   * Toggle Plan Active
   *
   * PRD Lines: 1544-1564
   *
   * Activate or deactivate a subscription plan.
   * - Updates the plan's isActive field
   * - Logs the action to adminActions with before/after metadata
   */
  togglePlanActive: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify plan exists
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, input.id),
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription plan not found",
        });
      }

      // Update the plan's isActive status
      await db
        .update(subscriptionPlans)
        .set({ isActive: input.isActive })
        .where(eq(subscriptionPlans.id, input.id));

      // Log the action to adminActions
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: input.isActive ? "activate_plan" : "deactivate_plan",
        targetType: "plan",
        targetId: input.id,
        reason: input.isActive ? "Plan activated" : "Plan deactivated",
        metadata: JSON.stringify({
          oldStatus: !input.isActive,
          newStatus: input.isActive,
        }),
      });

      return {
        success: true,
        planId: input.id,
        isActive: input.isActive,
      };
    }),
});
