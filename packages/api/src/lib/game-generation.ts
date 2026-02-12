import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { apiKeys, modelConfig } from "@arcade-vibe/db/schema/models";
import {
  allowedLibraryPatterns,
  themeAllowedPatterns,
} from "@arcade-vibe/db/schema/library-patterns";
import { getProviderModel } from "./ai-providers";
import { deductCredits, getUserCredits } from "./credits";
import { decryptApiKey } from "./encryption";
import { highlightCode } from "./highlighter";
import { uploadToCDN } from "./cdn";
import {
  sanitizeGameCode,
  buildLibraryListForSystemPrompt,
} from "./script-sanitizer";
import { streamText } from "ai";
import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ============================================================================
// Types & Interfaces
// ============================================================================

const EncryptionData = z.object({
  encrypted: z.string(),
  iv: z.string(),
});

export interface GenerateGameOptions {
  promptId: string;
  modelKey: string;
  userId: string;
  apiKeyId?: string;
  /** Custom reason for credit deduction (default: "Game generation") */
  creditReason?: string;
  /** Whether to verify prompt is public (for community prompt runs) */
  requirePublicPrompt?: boolean;
}

export interface GenerateGameChunkEvent {
  type: "chunk";
  gameId: string;
  code: string;
  highlighted: string;
}

export interface GenerateGameCompleteEvent {
  type: "complete";
  gameId: string;
  assetUrl: string;
  tokenUsage: number;
}

export interface GenerateGameErrorEvent {
  type: "error";
  gameId: string;
  error: string;
}

export type GenerateGameEvent =
  | GenerateGameChunkEvent
  | GenerateGameCompleteEvent
  | GenerateGameErrorEvent;

export interface GenerateGameResult {
  gameId: string;
  stream: AsyncGenerator<GenerateGameEvent>;
}

export interface PromptWithTheme {
  id: string;
  content: string;
  themeId: string;
  visibility: string;
  theme: {
    id: string;
    systemPrompt: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Decrypts a user's API key from storage
 */
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

/**
 * Gets the platform API key for a provider from environment variables
 */
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

/**
 * Fetches allowed library patterns for a theme (global + theme-specific)
 */
const fetchAllowedPatterns = async (themeId: string) => {
  const globalPatterns = await db.query.allowedLibraryPatterns.findMany({
    where: and(
      eq(allowedLibraryPatterns.status, "active"),
      eq(allowedLibraryPatterns.isGlobal, true),
    ),
  });

  const themePatterns = await db.query.themeAllowedPatterns.findMany({
    where: eq(themeAllowedPatterns.themeId, themeId),
  });

  const themePatternIds = themePatterns.map((tp) => tp.patternId);
  const additionalPatterns =
    themePatternIds.length > 0
      ? await db.query.allowedLibraryPatterns.findMany({
          where: inArray(allowedLibraryPatterns.id, themePatternIds),
        })
      : [];

  return [...globalPatterns, ...additionalPatterns];
};

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Unified game generation function that handles the complete flow:
 * 1. Fetches prompt with theme
 * 2. Fetches model configuration
 * 3. Checks/deducts credits (if not BYOK)
 * 4. Fetches allowed patterns for sanitization
 * 5. Creates game record with 'generating' status
 * 6. Builds system prompt
 * 7. Streams AI generation
 * 8. Uploads to CDN
 * 9. Sanitizes code
 * 10. Updates game record with final data
 */
export async function generateGame(
  options: GenerateGameOptions,
): Promise<GenerateGameResult> {
  const {
    promptId,
    modelKey,
    userId,
    apiKeyId,
    creditReason = "Game generation",
    requirePublicPrompt = false,
  } = options;

  // 1. Fetch prompt with theme
  const prompt = await db.query.prompts.findFirst({
    where: eq(prompts.id, promptId),
    with: { theme: true },
  });

  if (!prompt) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Prompt not found",
    });
  }

  // Verify prompt visibility if required
  if (requirePublicPrompt && prompt.visibility !== "public") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only run public prompts",
    });
  }

  // 2. Fetch model configuration with tier cost relation
  const modelConfigEntry = await db.query.modelConfig.findFirst({
    where: eq(modelConfig.modelName, modelKey),
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

  const tierCost = modelConfigEntry.tierCost;
  if (!tierCost) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Tier cost not found for model",
    });
  }

  // 3. Check credits if not BYOK
  if (!apiKeyId) {
    const creditCost = tierCost.creditCost;
    const userCredits = await getUserCredits(userId);

    if (userCredits < creditCost) {
      throw new TRPCError({
        code: "PAYMENT_REQUIRED",
        message: `Insufficient credits. Need ${creditCost}, have ${userCredits}.`,
      });
    }

    await deductCredits(userId, creditCost, creditReason, modelKey);
  }

  // 4. Fetch allowed library patterns for theme
  const allAllowedPatterns = await fetchAllowedPatterns(prompt.themeId);

  // Build library list for system prompt
  const libraryListText =
    allAllowedPatterns.length > 0
      ? buildLibraryListForSystemPrompt(allAllowedPatterns)
      : "";

  // 5. Create game record with 'generating' status
  const newGame = await db
    .insert(games)
    .values({
      promptId,
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

  // Store gameId in a const for closure (ensures type safety in generator)
  const confirmedGameId: string = gameId;

  // 6. Build full prompt
  const systemPrompt = `${prompt.theme.systemPrompt}\n\n${libraryListText}`;
  const userPrompt = prompt.content;

  // Fetch API key
  const apiKey = apiKeyId
    ? await getDecryptedUserKey(apiKeyId, userId)
    : getPlatformKey(modelConfigEntry.provider);

  // 7. Get provider model and stream
  const model = await getProviderModel(modelKey, apiKey);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const result = streamText({
    model,
    messages,
  });

  // Create the async generator
  async function* generateStream(): AsyncGenerator<GenerateGameEvent> {
    let fullCode = "";

    try {
      // Stream chunks
      for await (const chunk of result.textStream) {
        fullCode += chunk;

        // Apply Shiki syntax highlighting
        const highlighted = await highlightCode(fullCode, "html");

        yield {
          type: "chunk",
          gameId: confirmedGameId,
          code: fullCode,
          highlighted,
        };
      }

      // 8. Upload to CDN
      let assetUrl: string;
      try {
        assetUrl = await uploadToCDN(fullCode, confirmedGameId);
      } catch (error) {
        // Update game status to failed
        await db
          .update(games)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(games.id, confirmedGameId));

        yield {
          type: "error",
          gameId: confirmedGameId,
          error: "Failed to upload game to CDN",
        };
        return;
      }

      // Get token usage from the result
      const usage = await result.usage;
      const totalTokens = usage.totalTokens ?? 0;

      // 9. Sanitize the generated code
      const sanitizationResult = sanitizeGameCode(fullCode, allAllowedPatterns);

      // Log warning if scripts were blocked
      if (
        sanitizationResult.blockedUrls.length > 0 ||
        sanitizationResult.blockedInlineScripts > 0
      ) {
        console.warn(
          `Blocked ${sanitizationResult.blockedUrls.length} external URLs and ${sanitizationResult.blockedInlineScripts} inline scripts`,
        );
      }

      // 10. Update game status to completed with token usage
      await db
        .update(games)
        .set({
          gameData: sanitizationResult.sanitizedHtml,
          imageUrl: assetUrl,
          tokenUsage: totalTokens,
          generatedAt: new Date(),
          status: "completed",
          blockedScriptUrls: sanitizationResult.blockedUrls,
          sanitizationApplied:
            sanitizationResult.blockedUrls.length > 0 ||
            sanitizationResult.blockedInlineScripts > 0,
        })
        .where(eq(games.id, confirmedGameId));

      // Yield final completion event
      yield {
        type: "complete",
        gameId: confirmedGameId,
        assetUrl,
        tokenUsage: totalTokens,
      };
    } catch (error) {
      // Update game status to failed
      await db
        .update(games)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(games.id, confirmedGameId));

      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";

      yield {
        type: "error",
        gameId: confirmedGameId,
        error: errorMessage,
      };
    }
  }

  return {
    gameId: confirmedGameId,
    stream: generateStream(),
  };
}

// ============================================================================
// Re-export helper functions for backward compatibility
// ============================================================================

export { getDecryptedUserKey, getPlatformKey };
