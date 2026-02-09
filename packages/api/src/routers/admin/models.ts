import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
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
  if (SUPPORTED_PROVIDERS.includes(provider as (typeof SUPPORTED_PROVIDERS)[number])) {
    return provider;
  }
  return "openrouter";
}

function calculateTier(model: OpenRouterModel): "cheater" | "easy" | "normal" | "hard" | "impossible" {
  const promptPrice = parseFloat(model.pricing.prompt || "0");
  const completionPrice = parseFloat(model.pricing.completion || "0");
  const totalPrice = promptPrice + completionPrice;
  const contextLength = model.context_length;
  const supportsImages = model.architecture.input_modalities.includes("image");

  const pricePer1kTokens = totalPrice * 1000;

  if (contextLength >= 400000 && supportsImages) {
    return "cheater";
  }
  if (contextLength >= 200000 && supportsImages) {
    return "easy";
  }
  if (contextLength >= 128000 || pricePer1kTokens > 0.001) {
    return "normal";
  }
  if (contextLength >= 64000 || pricePer1kTokens > 0.0001) {
    return "hard";
  }
  return "impossible";
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

  const modelsToInsert = recentModels
    .map((model) => {
      const provider = getProviderFromId(model.id);
      const tier = calculateTier(model);
      const promptPrice = parseFloat(model.pricing.prompt || "0");
      const completionPrice = parseFloat(model.pricing.completion || "0");
      const totalPrice = (promptPrice + completionPrice) * 1000;

      return {
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
        modelName: model.id,
        tier,
        costPer1kTokens: totalPrice.toFixed(6),
        maxTokens: model.context_length,
        supportsImages: model.architecture.input_modalities.includes("image"),
        isActive: true,
      };
    });

  const existingModels = await db.query.modelConfig.findMany();
  if (existingModels.length > 0) {
    await db.delete(modelConfig);
  }

  const insertedModels = await db.insert(modelConfig).values(modelsToInsert).returning();
  return insertedModels.length;
}

export const modelConfigRouter = router({
  getModels: adminProcedure.query(async () => {
    const models = await db.query.modelConfig.findMany({
      orderBy: [desc(modelConfig.createdAt)],
    });

    return models;
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
        provider: z.enum([
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
        modelName: z.string().min(1).max(100),
        tier: z.enum(["cheater", "easy", "normal", "hard", "impossible"]),
        costPer1kTokens: z.string().min(1),
        maxTokens: z.number().int().positive(),
        supportsImages: z.boolean().default(false),
        isActive: z.boolean().default(true),
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

      const newModel = await db.insert(modelConfig).values({
        provider: input.provider,
        modelName: input.modelName,
        tier: input.tier,
        costPer1kTokens: input.costPer1kTokens,
        maxTokens: input.maxTokens,
        supportsImages: input.supportsImages,
        isActive: input.isActive,
      }).returning();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "add_model",
        targetType: "model",
        targetId: newModel[0]?.id,
        reason: `Added new model: ${input.modelName}`,
        metadata: JSON.stringify({
          provider: input.provider,
          modelName: input.modelName,
          tier: input.tier,
          costPer1kTokens: input.costPer1kTokens,
        }),
      });

      return {
        success: true,
        modelId: newModel[0]?.id,
        model: newModel[0],
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
        message: error instanceof Error ? error.message : "Failed to seed models",
      });
    }
  }),
});
