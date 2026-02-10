import { router, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { z } from "zod";
import { desc, eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Public Models Router
 *
 * Provides read-only access to active model configurations
 * Used by the prompt editor to display available models
 */
export const modelsRouter = router({
  /**
   * List all active models
   * Returns models with their tier, provider, and other metadata
   */
  listActive: publicProcedure.query(async () => {
    const activeModels = await db.query.modelConfig.findMany({
      where: eq(modelConfig.isActive, true),
      orderBy: [desc(modelConfig.createdAt)],
      with: {
        tierCost: true,
      },
    });

    return activeModels.map((model) => ({
      id: model.id,
      provider: model.provider,
      modelName: model.modelName,
      tier: model.tierCost?.slug ?? "unknown",
      tierName: model.tierCost?.name ?? "Unknown",
      maxTokens: model.maxTokens,
      supportsImages: model.supportsImages,
    }));
  }),

  /**
   * Get model metadata for the model selector
   * Returns models, tier costs, providers, and tiers for filtering
   */
  getModelMetadata: publicProcedure.query(async () => {
    const [activeModels, allTierCosts] = await Promise.all([
      db.query.modelConfig.findMany({
        where: eq(modelConfig.isActive, true),
        orderBy: [desc(modelConfig.createdAt)],
        with: {
          tierCost: true, // Load the related tier cost
        },
      }),
      db.query.tierCosts.findMany({
        where: eq(tierCosts.isActive, true),
        orderBy: [asc(tierCosts.displayOrder)],
      }),
    ]);

    // Build tier costs map for backward compatibility
    const tierCostsMap: Record<string, number> = {};
    for (const tc of allTierCosts) {
      tierCostsMap[tc.slug] = tc.creditCost;
    }

    return {
      models: activeModels.map((model) => ({
        id: model.id,
        provider: model.provider,
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
      })),
      tierCosts: tierCostsMap,
      tierCostsArray: allTierCosts.map((tc) => ({
        id: tc.id,
        slug: tc.slug,
        name: tc.name,
        creditCost: tc.creditCost,
        description: tc.description,
        scoreMultiplier: tc.scoreMultiplier,
        displayOrder: tc.displayOrder,
        colorClass: tc.colorClass,
      })),
      providers: [...new Set(activeModels.map((m) => m.provider))].sort(),
      tiers: allTierCosts.map((tc) => tc.slug),
    };
  }),

  /**
   * Get a specific model by name
   */
  getByName: publicProcedure
    .input(
      z.object({
        modelName: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.modelName, input.modelName),
        with: {
          tierCost: true,
        },
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      return {
        id: model.id,
        provider: model.provider,
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
      };
    }),
});
