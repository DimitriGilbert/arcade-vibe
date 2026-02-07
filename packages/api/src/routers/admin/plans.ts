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
 * - togglePlanActive: Activate/deactivate plan (PARTIALLY IMPLEMENTED - see note)
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
 * - isActive → NOT IN SCHEMA
 * - extraCreditMarkupPercent → NOT IN SCHEMA
 * - minExtraCreditsPurchase → NOT IN SCHEMA
 *
 * CRITICAL: The isActive field is missing from the schema, so togglePlanActive
 * cannot be fully implemented. This procedure is included but with a clear TODO
 * comment documenting the schema limitation.
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
   *
   * CRITICAL SCHEMA LIMITATION:
   * The subscriptionPlans schema does NOT include an `isActive` field.
   * This procedure cannot be fully implemented as designed in the PRD.
   *
   * POSSIBLE WORKAROUNDS (not implemented here):
   * 1. Add an `isActive` boolean field to the schema (recommended)
   * 2. Use a price of 0 or null to indicate inactive (not recommended)
   * 3. Maintain a separate plan status mapping elsewhere (not recommended)
   *
   * This procedure throws an error with a clear message explaining the limitation.
   * Once the schema is updated to include an `isActive` field, this procedure
   * should be updated to:
   * 1. Accept a plan ID and isActive boolean
   * 2. Update the plan's isActive field
   * 3. Log the action to adminActions with before/after metadata
   */
  togglePlanActive: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx: _ctx, input }) => {
      // ctx.user.id will be used when isActive field is added to schema
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

      // SCHEMA LIMITATION: The isActive field does not exist in the schema
      // TODO: Add isActive boolean field to subscriptionPlans schema
      // Schema location: packages/db/src/schema/credits.ts
      // Once added, uncomment and use the following code:

      /*
      await db
        .update(subscriptionPlans)
        .set({ isActive: input.isActive })
        .where(eq(subscriptionPlans.id, input.id));

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
      */

      // For now, throw an error explaining the limitation
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "togglePlanActive cannot be implemented: The subscriptionPlans schema is missing an `isActive` field. " +
          "Please add `isActive: boolean('is_active').notNull().default(true)` to the schema in packages/db/src/schema/credits.ts, " +
          "run `pnpm run db:generate` and `pnpm run db:push`, then update this procedure.",
      });
    }),
});
