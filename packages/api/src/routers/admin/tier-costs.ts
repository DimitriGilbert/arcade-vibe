import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { eq } from "drizzle-orm";

type ModelTier =
  | "cheater"
  | "very_easy"
  | "easy"
  | "normal"
  | "hard"
  | "very_hard"
  | "impossible";

// Default credit costs by tier
const DEFAULT_TIER_COSTS: Record<ModelTier, number> = {
  cheater: 20,
  very_easy: 16,
  easy: 12,
  normal: 8,
  hard: 5,
  very_hard: 3,
  impossible: 2,
};

export const tierCostsRouter = router({
  // Get all tier costs
  getTierCosts: adminProcedure.query(async () => {
    const costs = await db.query.tierCosts.findMany();

    // Merge with defaults to ensure all tiers are represented
    const allTiers: ModelTier[] = [
      "cheater",
      "very_easy",
      "easy",
      "normal",
      "hard",
      "very_hard",
      "impossible",
    ];

    return allTiers.map((tier) => {
      const existing = costs.find((c) => c.tier === tier);
      return {
        tier,
        creditCost: existing?.creditCost ?? DEFAULT_TIER_COSTS[tier],
        description: existing?.description ?? null,
        isCustom: !!existing,
      };
    });
  }),

  // Update a tier cost
  updateTierCost: adminProcedure
    .input(
      z.object({
        tier: z.enum([
          "cheater",
          "very_easy",
          "easy",
          "normal",
          "hard",
          "very_hard",
          "impossible",
        ]),
        creditCost: z.number().int().positive(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.tierCosts.findFirst({
        where: eq(tierCosts.tier, input.tier),
      });

      if (existing) {
        await db
          .update(tierCosts)
          .set({
            creditCost: input.creditCost,
            description: input.description ?? existing.description,
          })
          .where(eq(tierCosts.tier, input.tier));
      } else {
        await db.insert(tierCosts).values({
          tier: input.tier,
          creditCost: input.creditCost,
          description: input.description,
        });
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "update_tier_cost",
        targetType: "system",
        targetId: "tier_costs",
        reason: `Updated ${input.tier} tier cost to ${input.creditCost} credits`,
        metadata: JSON.stringify({
          tier: input.tier,
          oldCost:
            existing?.creditCost ?? DEFAULT_TIER_COSTS[input.tier as ModelTier],
          newCost: input.creditCost,
        }),
      });

      return {
        success: true,
        tier: input.tier,
        creditCost: input.creditCost,
      };
    }),

  // Reset tier cost to default
  resetTierCost: adminProcedure
    .input(
      z.object({
        tier: z.enum([
          "cheater",
          "very_easy",
          "easy",
          "normal",
          "hard",
          "very_hard",
          "impossible",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.tierCosts.findFirst({
        where: eq(tierCosts.tier, input.tier),
      });

      if (existing) {
        await db.delete(tierCosts).where(eq(tierCosts.tier, input.tier));
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "reset_tier_cost",
        targetType: "system",
        targetId: "tier_costs",
        reason: `Reset ${input.tier} tier cost to default`,
        metadata: JSON.stringify({
          tier: input.tier,
          resetFrom: existing?.creditCost ?? "default",
          resetTo: DEFAULT_TIER_COSTS[input.tier as ModelTier],
        }),
      });

      return {
        success: true,
        tier: input.tier,
        creditCost: DEFAULT_TIER_COSTS[input.tier as ModelTier],
      };
    }),

  // Initialize all tier costs with defaults
  initializeDefaults: adminProcedure.mutation(async ({ ctx }) => {
    const existing = await db.query.tierCosts.findMany();
    const existingTiers = new Set(existing.map((c) => c.tier));

    const toInsert = Object.entries(DEFAULT_TIER_COSTS)
      .filter(([tier]) => !existingTiers.has(tier as ModelTier))
      .map(([tier, creditCost]) => ({
        tier: tier as ModelTier,
        creditCost,
        description: `Default cost for ${tier} tier`,
      }));

    if (toInsert.length > 0) {
      await db.insert(tierCosts).values(toInsert);
    }

    await db.insert(adminActions).values({
      adminId: ctx.user.id,
      actionType: "initialize_tier_costs",
      targetType: "system",
      targetId: "tier_costs",
      reason: `Initialized ${toInsert.length} tier costs with defaults`,
      metadata: JSON.stringify({
        initializedTiers: toInsert.map((t) => t.tier),
      }),
    });

    return {
      success: true,
      initializedCount: toInsert.length,
    };
  }),
});
