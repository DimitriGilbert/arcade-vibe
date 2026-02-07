import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
});
