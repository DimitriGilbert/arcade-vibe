import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig, modelProviders } from "@arcade-vibe/db/schema/models";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  context_length: number;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

const SUPPORTED_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "glm",
  "moonshot",
] as const;

const SIX_MONTHS_SECONDS = 6 * 30 * 24 * 60 * 60;

function getProviderFromId(modelId: string): string {
  const parts = modelId.split("/");
  const provider = parts[0] as string;
  if (
    SUPPORTED_PROVIDERS.includes(
      provider as (typeof SUPPORTED_PROVIDERS)[number],
    )
  ) {
    return provider;
  }
  return "openrouter";
}

interface TierCost {
  id: string;
  slug: string;
  scoreMultiplier: number;
  isActive: boolean;
}

// Price cap for "cheater" tier: $18.1 per 1M tokens = $0.0181 per 1k tokens
// Anything above this is an outlier and goes directly to "cheater"
const CHEATER_PRICE_CAP_PER_1K = 0.0181;

/**
 * Calculate tier assignments for all models using percentile-based distribution.
 * This ensures models are evenly spread across tiers rather than compressed by logarithmic scale.
 *
 * Rules:
 * - Models > $18.1/1M tokens → "cheater" (outliers like o1-pro at $750/1M)
 * - Remaining models distributed by price percentiles across other tiers
 * - Most expensive (within cap) → low multiplier tier (easy)
 * - Cheapest → high multiplier tier (hard)
 * - Free models (price = 0) → "hard" tier
 */
function calculateTierAssignments(
  models: OpenRouterModel[],
  tiers: TierCost[],
): Map<string, string> {
  const result = new Map<string, string>();

  // Get active tiers sorted by scoreMultiplier ASCENDING
  // Low multiplier (0.8 = cheater) first, high multiplier (2.5 = impossible) last
  const activeTiers = tiers
    .filter((t) => t.isActive)
    .sort((a, b) => a.scoreMultiplier - b.scoreMultiplier);

  const numTiers = activeTiers.length;

  if (numTiers === 0) {
    models.forEach((m) => result.set(m.id, "normal"));
    return result;
  }

  // Get the "cheater" tier (lowest multiplier = easiest)
  const cheaterTierSlug = activeTiers[0]?.slug ?? "cheater";
  const hardTierSlug = activeTiers.find((t) => t.slug === "hard")?.slug;

  // Calculate price per 1k tokens for each model
  const modelPrices = models.map((m) => {
    const promptPrice = parseFloat(m.pricing.prompt || "0");
    const completionPrice = parseFloat(m.pricing.completion || "0");
    return (promptPrice + completionPrice) * 1000;
  });

  // Separate models into categories
  const modelsWithPrices: Array<{
    model: OpenRouterModel;
    price: number;
    index: number;
  }> = [];
  const freeModels: OpenRouterModel[] = [];
  const outlierModels: OpenRouterModel[] = [];

  models.forEach((model, index) => {
    const price = modelPrices[index];
    if (price === undefined || price === 0) {
      freeModels.push(model);
    } else if (price > CHEATER_PRICE_CAP_PER_1K) {
      outlierModels.push(model);
    } else {
      modelsWithPrices.push({ model, price, index });
    }
  });

  // Handle free models → "hard" tier
  freeModels.forEach((m) => {
    result.set(
      m.id,
      hardTierSlug ?? activeTiers[Math.floor(numTiers / 2)]?.slug ?? "normal",
    );
  });

  // Handle outliers → "cheater" tier
  outlierModels.forEach((m) => {
    result.set(m.id, cheaterTierSlug);
  });

  // If no models with prices within cap, we're done
  if (modelsWithPrices.length === 0) {
    return result;
  }

  // Sort models by price DESCENDING (most expensive first)
  modelsWithPrices.sort((a, b) => b.price - a.price);

  // Distribute models evenly across tiers using percentile ranks
  // Each tier gets approximately the same number of models
  const modelsPerTier = modelsWithPrices.length / numTiers;

  modelsWithPrices.forEach((item, sortedIndex) => {
    // Calculate which tier this model should go to based on its rank
    // sortedIndex 0 (most expensive) → tier 0 (low multiplier = easy)
    // sortedIndex N (cheapest) → tier last (high multiplier = hard)
    const tierIndex = Math.min(
      numTiers - 1,
      Math.floor(sortedIndex / modelsPerTier),
    );

    const tierSlug = activeTiers[tierIndex]?.slug ?? "normal";
    result.set(item.model.id, tierSlug);
  });

  return result;
}

async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const response = await fetch("https://openrouter.ai/api/v1/models");
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }
  const data = (await response.json()) as OpenRouterResponse;
  return data.data;
}

async function seedModelsFromOpenRouter() {
  const models = await fetchOpenRouterModels();
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - SIX_MONTHS_SECONDS;

  const recentModels = models.filter((model) => model.created >= sixMonthsAgo);

  const allTierCosts = await db.query.tierCosts.findMany();
  const tierCostMap = new Map(allTierCosts.map((tc) => [tc.slug, tc.id]));

  const tierAssignments = calculateTierAssignments(recentModels, allTierCosts);

  const existingModels = await db.query.modelConfig.findMany();
  const existingModelNames = new Set(existingModels.map((m) => m.modelName));

  let insertedCount = 0;

  for (const model of recentModels) {
    if (existingModelNames.has(model.id)) {
      continue;
    }

    const primaryProvider = getProviderFromId(model.id);
    const tierSlug = tierAssignments.get(model.id) ?? "normal";
    const tierCostId = tierCostMap.get(tierSlug);
    const promptPrice = parseFloat(model.pricing.prompt || "0");
    const completionPrice = parseFloat(model.pricing.completion || "0");
    const totalPrice = (promptPrice + completionPrice) * 1000;

    if (!tierCostId) {
      console.warn(
        `Tier cost not found for slug: ${tierSlug}, skipping model ${model.id}`,
      );
      continue;
    }

    const providers: string[] = [];
    if (primaryProvider !== "openrouter") {
      providers.push(primaryProvider);
    }
    providers.push("openrouter");

    const [newModel] = await db
      .insert(modelConfig)
      .values({
        modelName: model.id,
        tierCostId,
        costPer1kTokens: totalPrice.toFixed(6),
        maxTokens: model.context_length,
        supportsImages: model.architecture.input_modalities.includes("image"),
        isActive: true,
        modelCreatedAt: new Date(model.created * 1000),
      })
      .returning();

    if (newModel) {
      await db.insert(modelProviders).values(
        providers.map((provider) => ({
          modelConfigId: newModel.id,
          provider: provider as
            | "openai"
            | "anthropic"
            | "google"
            | "openrouter"
            | "deepseek"
            | "glm"
            | "glm-coding-plan"
            | "moonshot"
            | "custom",
        })),
      );
      insertedCount++;
    }
  }

  return insertedCount;
}

export const modelConfigRouter = router({
  getModels: adminProcedure.query(async () => {
    const models = await db.query.modelConfig.findMany({
      orderBy: [desc(modelConfig.modelCreatedAt)],
      with: {
        tierCost: true,
        providers: true,
      },
    });

    return models.map((model) => ({
      ...model,
      providers: model.providers.map((p) => p.provider),
      tier: model.tierCost?.slug ?? "unknown",
      tierName: model.tierCost?.name ?? "Unknown",
    }));
  }),

  toggleModelActive: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.id),
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      await db
        .update(modelConfig)
        .set({ isActive: input.isActive })
        .where(eq(modelConfig.id, input.id));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: input.isActive ? "activate_model" : "deactivate_model",
        targetType: "model",
        targetId: input.id,
        reason: input.isActive ? "Model activated" : "Model deactivated",
      });

      return {
        success: true,
        modelId: input.id,
        isActive: input.isActive,
      };
    }),

  updateModelPricing: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        costPer1kTokens: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.id),
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      await db
        .update(modelConfig)
        .set({ costPer1kTokens: input.costPer1kTokens })
        .where(eq(modelConfig.id, input.id));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "update_model_pricing",
        targetType: "model",
        targetId: input.id,
        reason: `Cost per 1k tokens changed from ${model.costPer1kTokens} to ${input.costPer1kTokens}`,
        metadata: JSON.stringify({
          oldCost: model.costPer1kTokens,
          newCost: input.costPer1kTokens,
        }),
      });

      return {
        success: true,
        modelId: input.id,
        oldCost: model.costPer1kTokens,
        newCost: input.costPer1kTokens,
      };
    }),

  addModel: adminProcedure
    .input(
      z.object({
        providers: z.array(
          z.enum([
            "openai",
            "anthropic",
            "google",
            "openrouter",
            "deepseek",
            "glm",
            "glm-coding-plan",
            "moonshot",
            "custom",
          ]),
        ),
        modelName: z.string().min(1).max(100),
        tierCostId: z.string().uuid(),
        costPer1kTokens: z.string().min(1),
        maxTokens: z.number().int().positive(),
        supportsImages: z.boolean().default(false),
        isActive: z.boolean().default(true),
        modelCreatedAt: z.coerce.date().default(() => new Date()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingModel = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.modelName, input.modelName),
      });

      if (existingModel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Model already exists",
        });
      }

      const tierCost = await db.query.tierCosts.findFirst({
        where: eq(tierCosts.id, input.tierCostId),
      });

      if (!tierCost) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tier cost not found",
        });
      }

      const [newModel] = await db
        .insert(modelConfig)
        .values({
          modelName: input.modelName,
          tierCostId: input.tierCostId,
          costPer1kTokens: input.costPer1kTokens,
          maxTokens: input.maxTokens,
          supportsImages: input.supportsImages,
          isActive: input.isActive,
          modelCreatedAt: input.modelCreatedAt,
        })
        .returning();

      if (newModel && input.providers.length > 0) {
        await db.insert(modelProviders).values(
          input.providers.map((provider) => ({
            modelConfigId: newModel.id,
            provider,
          })),
        );
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "add_model",
        targetType: "model",
        targetId: newModel?.id,
        reason: `Added new model: ${input.modelName}`,
        metadata: JSON.stringify({
          providers: input.providers,
          modelName: input.modelName,
          tierCostId: input.tierCostId,
          tierSlug: tierCost.slug,
          costPer1kTokens: input.costPer1kTokens,
        }),
      });

      return {
        success: true,
        modelId: newModel?.id,
        model: newModel,
      };
    }),

  seedModels: adminProcedure.mutation(async ({ ctx }) => {
    try {
      const insertedCount = await seedModelsFromOpenRouter();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "seed_models",
        targetType: "system",
        targetId: "model_config",
        reason: `Seeded ${insertedCount} models from OpenRouter`,
        metadata: JSON.stringify({
          insertedCount,
          source: "openrouter",
          filters: "last_6_months",
        }),
      });

      return {
        success: true,
        insertedCount,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to seed models",
      });
    }
  }),

  deleteModel: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.id),
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

      await db.delete(modelConfig).where(eq(modelConfig.id, input.id));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "delete_model",
        targetType: "model",
        targetId: input.id,
        reason: `Deleted model: ${model.modelName}`,
        metadata: JSON.stringify({
          providers: model.providers.map((p) => p.provider),
          modelName: model.modelName,
          tierCostId: model.tierCostId,
          tierSlug: model.tierCost?.slug,
        }),
      });

      return {
        success: true,
        modelId: input.id,
      };
    }),

  bulkDeleteModels: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const models = await db.query.modelConfig.findMany({
        where: inArray(modelConfig.id, input.ids),
      });

      if (models.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No models found",
        });
      }

      await db.delete(modelConfig).where(inArray(modelConfig.id, input.ids));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "bulk_delete_models",
        targetType: "model",
        targetId: "bulk",
        reason: `Bulk deleted ${models.length} models`,
        metadata: JSON.stringify({
          count: models.length,
          modelNames: models.map((m) => m.modelName),
        }),
      });

      return {
        success: true,
        deletedCount: models.length,
      };
    }),

  bulkToggleModelsActive: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const models = await db.query.modelConfig.findMany({
        where: inArray(modelConfig.id, input.ids),
      });

      if (models.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No models found",
        });
      }

      await db
        .update(modelConfig)
        .set({ isActive: input.isActive })
        .where(inArray(modelConfig.id, input.ids));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: input.isActive
          ? "bulk_activate_models"
          : "bulk_deactivate_models",
        targetType: "model",
        targetId: "bulk",
        reason: input.isActive
          ? `Bulk activated ${models.length} models`
          : `Bulk deactivated ${models.length} models`,
        metadata: JSON.stringify({
          count: models.length,
          isActive: input.isActive,
          modelNames: models.map((m) => m.modelName),
        }),
      });

      return {
        success: true,
        updatedCount: models.length,
        isActive: input.isActive,
      };
    }),

  bulkUpdateModelsTier: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1),
        tierCostId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const models = await db.query.modelConfig.findMany({
        where: inArray(modelConfig.id, input.ids),
      });

      if (models.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No models found",
        });
      }

      // Verify tier cost exists
      const tierCost = await db.query.tierCosts.findFirst({
        where: eq(tierCosts.id, input.tierCostId),
      });

      if (!tierCost) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tier cost not found",
        });
      }

      await db
        .update(modelConfig)
        .set({ tierCostId: input.tierCostId })
        .where(inArray(modelConfig.id, input.ids));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "bulk_update_models_tier",
        targetType: "model",
        targetId: "bulk",
        reason: `Bulk updated ${models.length} models to tier: ${tierCost.name} (${tierCost.slug})`,
        metadata: JSON.stringify({
          count: models.length,
          tierCostId: input.tierCostId,
          tierSlug: tierCost.slug,
          modelNames: models.map((m) => m.modelName),
        }),
      });

      return {
        success: true,
        updatedCount: models.length,
        tierCostId: input.tierCostId,
        tierSlug: tierCost.slug,
      };
    }),
});
