import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { games } from "@arcade-vibe/db/schema/games";
import { apiKeys, modelConfig } from "@arcade-vibe/db/schema/models";
import { getProviderModel } from "@arcade-vibe/api/lib/ai-providers";
import { deductCredits, getUserCredits } from "@arcade-vibe/api/lib/credits";
import { decryptApiKey } from "@arcade-vibe/api/lib/encryption";
import { highlightCode } from "@arcade-vibe/api/lib/highlighter";
import { uploadToCDN } from "@arcade-vibe/api/lib/cdn";
import { streamText } from "ai";
import { z } from "zod";
import { eq, desc, and, isNotNull, notInArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const EncryptionData = z.object({
  encrypted: z.string(),
  iv: z.string(),
});

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

export const promptRunsRouter = router({
  /**
   * Run another user's public prompt with a different model
   * Supports BYOK via apiKeyId
   * Streams the generation process
   */
  create: protectedProcedure
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

      // Fetch prompt with theme and author
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
        with: {
          theme: true,
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // Verify prompt is public
      if (prompt.visibility !== "public") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only run public prompts",
        });
      }

      // Fetch model configuration with tier cost relation
      const modelConfigEntry = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.modelName, input.modelKey),
        with: {
          tierCost: true,
        },
      });

      if (!modelConfigEntry || !modelConfigEntry.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Model not available",
        });
      }

      // Get tier cost from the relation
      const tierCost = modelConfigEntry.tierCost;
      if (!tierCost) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tier cost not found for model",
        });
      }

      // Check credits if not BYOK
      if (!input.apiKeyId) {
        const creditCost = tierCost.creditCost;
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
          "Community prompt run",
          input.modelKey,
        );
      }

      // Fetch API key
      const apiKey = input.apiKeyId
        ? await getDecryptedUserKey(input.apiKeyId, ctx.user.id)
        : getPlatformKey(modelConfigEntry.provider);

      // Create game record linked to prompt with 'generating' status
      const newGame = await db
        .insert(games)
        .values({
          promptId: input.promptId,
          themeId: prompt.themeId,
          modelProvider: modelConfigEntry.provider,
          modelName: modelConfigEntry.modelName,
          tierCostId: tierCost.id,
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
          promptId: input.promptId,
          promptAuthor: prompt.user,
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

      // Update game status to completed
      await db
        .update(games)
        .set({
          gameData: fullCode,
          imageUrl: assetUrl,
          generatedAt: new Date(),
          status: "completed",
        })
        .where(eq(games.id, gameId));

      // Yield final completion event
      yield {
        type: "complete",
        gameId,
        promptId: input.promptId,
        promptAuthor: prompt.user,
        assetUrl,
        isComplete: true,
      };
    }),

  /**
   * List all runs of a public prompt
   * Includes games generated by users running others' prompts
   * Supports pagination
   */
  listByPrompt: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // Verify prompt is public
      if (prompt.visibility !== "public") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot list runs for non-public prompts",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const result = await gamesQuery.findMany({
        where: and(
          eq(games.promptId, input.promptId),
          eq(games.isHidden, false),
        ),
        orderBy: [desc(games.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          theme: true,
        },
      });

      return result;
    }),

  /**
   * List current user's runs of other users' prompts
   * Only includes games where promptId is not null
   * Supports pagination
   * Optimized to filter at database level
   */
  listMine: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const userId = ctx.user.id;

      // Get all prompt IDs by this user
      const userPrompts = await db.query.prompts.findMany({
        where: eq(prompts.authorId, userId),
        columns: { id: true },
      });
      const userPromptIds = userPrompts.map((p) => p.id);

      // Query games where promptId is NOT in user's prompts
      // This filters at the database level for better performance
      const result = await db.query.games.findMany({
        where: and(
          isNotNull(games.promptId),
          eq(games.isHidden, false),
          // If user has prompts, exclude games using those prompts
          userPromptIds.length > 0
            ? notInArray(games.promptId, userPromptIds)
            : undefined,
        ),
        orderBy: [desc(games.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          theme: true,
        },
      });

      return result;
    }),
});
