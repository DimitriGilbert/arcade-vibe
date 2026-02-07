import { router, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
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
    });

    return activeModels.map((model) => ({
      id: model.id,
      provider: model.provider,
      modelName: model.modelName,
      tier: model.tier,
      maxTokens: model.maxTokens,
      supportsImages: model.supportsImages,
    }));
  }),

  /**
   * Get a specific model by name
   */
  getByName: publicProcedure
    .input(
      z.object({
        modelName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.modelName, input.modelName),
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
        tier: model.tier,
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
      };
    }),
});
