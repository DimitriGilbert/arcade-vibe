import { router, protectedProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { apiKeys, modelConfig } from "@arcade-vibe/db/schema/models";
import { getProviderModel } from "@arcade-vibe/api/lib/ai-providers";
import { deductCredits, getUserCredits } from "@arcade-vibe/api/lib/credits";
import { decryptApiKey } from "@arcade-vibe/api/lib/encryption";
import { highlightCode } from "@arcade-vibe/api/lib/highlighter";
import { uploadToCDN } from "@arcade-vibe/api/lib/cdn";
import { streamText } from "ai";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type ModelTier = "cheater" | "easy" | "normal" | "hard" | "impossible";

const EncryptionData = z.object({
  encrypted: z.string(),
  iv: z.string(),
});

// Helper function to get credit cost based on model tier
const getCreditCostByTier = (tier: string): number => {
  const creditCosts: Record<string, number> = {
    cheater: 20,
    easy: 12,
    normal: 8,
    hard: 5,
    impossible: 2,
  };
  return creditCosts[tier] ?? 8; // Default to normal tier cost
};

const getDecryptedUserKey = async (
  apiKeyId: string,
  userId: string,
): Promise<string> => {
  const keyRecord = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, apiKeyId), eq(apiKeys.userId, userId)),
  });

  if (!keyRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "API key not found",
    });
  }

  if (!keyRecord.keyHash) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid keyHash data",
    });
  }

  const encryptionData = EncryptionData.parse(JSON.parse(keyRecord.keyHash));
  return decryptApiKey(encryptionData.encrypted, encryptionData.iv);
};

const getPlatformKey = (provider: string): string => {
  const envKeyMap: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    glm: "GLM_API_KEY",
    "glm-coding-plan": "GLM_CODING_PLAN_API_KEY",
    moonshot: "MOONSHOT_API_KEY",
    custom: "CUSTOM_API_KEY",
  };

  const envKey = envKeyMap[provider];
  if (!envKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown provider: ${provider}`,
    });
  }

  const apiKey = process.env[envKey];
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Platform API key not configured for ${provider}`,
    });
  }

  return apiKey;
};

export const generateRouter = router({
  streamGeneration: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        modelKey: z.string().min(1),
        apiKeyId: z.string().uuid().optional(),
      }),
    )
    .mutation(async function* ({ input, ctx }) {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Fetch prompt with theme
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
        with: { theme: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // Fetch model configuration
      const modelConfigEntry = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.modelName, input.modelKey),
      });

      if (!modelConfigEntry || !modelConfigEntry.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Model not available",
        });
      }

      // Check credits if not BYOK
      if (!input.apiKeyId) {
        const creditCost = getCreditCostByTier(modelConfigEntry.tier);
        const userCredits = await getUserCredits(ctx.user.id);

        if (userCredits < creditCost) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: `Insufficient credits. Need ${creditCost}, have ${userCredits}.`,
          });
        }

        await deductCredits(
          ctx.user.id,
          creditCost,
          "Game generation",
          input.modelKey,
        );
      }

      // Fetch API key
      const apiKey = input.apiKeyId
        ? await getDecryptedUserKey(input.apiKeyId, ctx.user.id)
        : getPlatformKey(modelConfigEntry.provider);

      // Create game record with 'generating' status
      const newGame = await db
        .insert(games)
        .values({
          promptId: input.promptId,
          themeId: prompt.themeId,
          modelProvider: modelConfigEntry.provider,
          modelName: modelConfigEntry.modelName,
          modelTier: modelConfigEntry.tier as ModelTier,
          status: "generating",
        })
        .returning();

      const gameId = newGame[0]?.id;
      if (!gameId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create game record",
        });
      }

      // Build full prompt
      const systemPrompt = prompt.theme.systemPrompt;
      const userPrompt = prompt.content;

      // Get provider model
      const model = await getProviderModel(input.modelKey, apiKey);

      // Prepare messages for AI SDK
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ];

      // Stream using AI SDK - NO maxTokens limit
      const result = streamText({
        model,
        messages,
        // NO maxTokens - let the model generate until completion
      });

      let fullCode = "";

      // Stream chunks
      for await (const chunk of result.textStream) {
        fullCode += chunk;

        // Apply Shiki syntax highlighting
        const highlighted = await highlightCode(fullCode, "html");

        yield {
          type: "chunk",
          gameId,
          code: fullCode,
          highlighted,
          isComplete: false,
        };
      }

      // Upload to CDN with retry on completion
      let assetUrl: string;
      try {
        assetUrl = await uploadToCDN(fullCode, gameId);
      } catch (error) {
        // Update game status to failed
        await db
          .update(games)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(games.id, gameId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload game to CDN",
        });
      }

      // Get token usage from the result per PRD lines 756-759
      const totalTokens = (await result.usage).totalTokens;

      // Update game status to completed with token usage
      await db
        .update(games)
        .set({
          gameData: fullCode,
          imageUrl: assetUrl,
          tokenUsage: totalTokens,
          generatedAt: new Date(),
          status: "completed",
        })
        .where(eq(games.id, gameId));

      // Yield final completion event
      yield {
        type: "complete",
        gameId,
        assetUrl,
        tokenUsage: totalTokens,
        isComplete: true,
      };
    }),
});
