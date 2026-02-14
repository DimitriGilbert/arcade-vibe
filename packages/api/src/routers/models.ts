import { router, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { z } from "zod";
import { desc, eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const modelsRouter = router({
  listActive: publicProcedure.query(async () => {
    const activeModels = await db.query.modelConfig.findMany({
      where: eq(modelConfig.isActive, true),
      orderBy: [desc(modelConfig.createdAt)],
      with: {
        tierCost: true,
        providers: true,
      },
    });

    return activeModels.map((model) => ({
      id: model.id,
      providers: model.providers.map((p) => p.provider),
      modelName: model.modelName,
      tier: model.tierCost?.slug ?? "unknown",
      tierName: model.tierCost?.name ?? "Unknown",
      maxTokens: model.maxTokens,
      supportsImages: model.supportsImages,
    }));
  }),

  getModelMetadata: publicProcedure.query(async () => {
    const [activeModels, allTierCosts] = await Promise.all([
      db.query.modelConfig.findMany({
        where: eq(modelConfig.isActive, true),
        orderBy: [desc(modelConfig.createdAt)],
        with: {
          tierCost: true,
          providers: true,
        },
      }),
      db.query.tierCosts.findMany({
        where: eq(tierCosts.isActive, true),
        orderBy: [asc(tierCosts.displayOrder)],
      }),
    ]);

    const tierCostsMap: Record<string, number> = {};
    for (const tc of allTierCosts) {
      tierCostsMap[tc.slug] = tc.creditCost;
    }

    const allProviders = new Set<string>();
    for (const model of activeModels) {
      for (const p of model.providers) {
        allProviders.add(p.provider);
      }
    }

    return {
      models: activeModels.map((model) => ({
        id: model.id,
        providers: model.providers.map((p) => p.provider),
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
      providers: [...allProviders].sort(),
      tiers: allTierCosts.map((tc) => tc.slug),
    };
  }),

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
          providers: true,
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
        providers: model.providers.map((p) => p.provider),
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
      };
    }),
});
