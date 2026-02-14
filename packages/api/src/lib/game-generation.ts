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
  creditReason?: string;
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
// Common System Prompt (injected for ALL themes)
// ============================================================================

// const COMMON_SYSTEM_PROMPT = `## Output Format (CRITICAL)

// Your code will be injected inside the <body> tag of an existing HTML page. The Arcade Vibe SDK is already loaded in the page header.

// ### DO NOT Generate:
// - <!DOCTYPE html> declaration
// - <html>, <head>, or <body> tags
// - Another window.ArcadeVibe definition (it already exists)

// ### DO Generate:
// - HTML elements for your game (canvases, divs, buttons, etc.)
// - <style> tags for CSS styling
// - <script> tags for JavaScript game logic

// ### Example Correct Output:
// \`\`\`html
// <style>
//   #game { width: 100%; height: 100%; background: #000; }
//   .score { position: absolute; top: 10px; left: 10px; color: #fff; }
// </style>
// <canvas id="game"></canvas>
// <div class="score">Score: <span id="score">0</span></div>
// <script>
//   const canvas = document.getElementById('game');
//   const ctx = canvas.getContext('2d');
//   let score = 0;

//   // Your game logic here...

//   function gameOver() {
//     ArcadeVibe.reportScore(score);
//   }
// </script>
// \`\`\`

// ## Arcade Vibe SDK Integration

// Your game runs in an iframe with the Arcade Vibe SDK pre-loaded. You MUST use it for score tracking.

// ### Available API:
// - \`ArcadeVibe.reportScore(score)\` - Submit a score to the leaderboard. Call this when:
//   - Player completes a level
//   - Player loses all lives (game over)
//   - Player achieves a new high score

//   The score must be a positive integer.

// - \`ArcadeVibe.getPlaytime()\` - Get current session playtime in seconds

// - \`ArcadeVibe.isReady()\` - Check if SDK is properly initialized (returns boolean)

// ### Integration Example:
// \`\`\`javascript
// // When player gets game over
// function gameOver() {
//   ArcadeVibe.reportScore(finalScore);
//   showGameOverScreen();
// }

// // When player completes a level
// function levelComplete() {
//   ArcadeVibe.reportScore(currentScore);
//   loadNextLevel();
// }
// \`\`\`

// DO NOT implement your own score tracking via postMessage or fetch. The SDK handles all communication securely.`;
const COMMON_SYSTEM_PROMPT = `## Output Format

Your code will be injected inside the <body> tag of an existing HTML page. The Arcade Vibe SDK is already loaded in the page header.

### Do NOT generate:
- <!DOCTYPE html>, <html>, <head>, or <body> tags
- Another window.ArcadeVibe definition

### Do generate:
- <style> tags, HTML elements, <script> tags — nothing else

## Arcade Vibe SDK

Call \`ArcadeVibe.reportScore(score)\` with a positive integer whenever the player reaches a game over or completes a level. Do not implement your own score reporting via postMessage or fetch.

Other available methods:
- \`ArcadeVibe.getPlaytime()\` — current session duration in seconds
- \`ArcadeVibe.isReady()\` — returns true if SDK is initialized

## Robustness Rules

These are non-negotiable:
- Wrap all JS in a \`DOMContentLoaded\` listener to avoid race conditions
- Use \`requestAnimationFrame\` for the game loop — never \`setInterval\` for rendering
- Declare all variables with \`const\` or \`let\`, no implicit globals
- The outer layout must use responsive sizing (100vw / 100vh or percentages) — no fixed pixel dimensions

## Output Rules

Return only the raw HTML snippet. No markdown fences, no explanations, no comments addressed to the reader.

## Every Game Must Have

1. **Score** — visible at all times, updated in real time
2. **Lives or health** — the player can fail and reach a game over state  
3. **Progressive difficulty** — the game gets meaningfully harder over time (speed, frequency, complexity)
4. **A complete game loop** — Start screen → Gameplay → Game Over → Restart, all accessible without a page reload
5. **Instructions** — one or two lines on the start screen explaining how to play
`;
// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Decrypts a user's API key from storage
 */
type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "deepseek"
  | "glm"
  | "glm-coding-plan"
  | "moonshot"
  | "custom";

const getDecryptedUserKey = async (
  apiKeyId: string,
  userId: string,
): Promise<{ apiKey: string; provider: Provider }> => {
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
  return {
    apiKey: decryptApiKey(encryptionData.encrypted, encryptionData.iv),
    provider: keyRecord.provider as Provider,
  };
};

const PLATFORM_PROVIDERS_WITH_KEYS: Provider[] = [
  "openrouter",
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "glm",
  "moonshot",
];

const getPlatformKey = (provider: Provider): { apiKey: string; provider: Provider } => {
  const envKeyMap: Record<Provider, string> = {
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

  return { apiKey, provider };
};

const selectPlatformProvider = (availableProviders: string[]): Provider => {
  for (const provider of PLATFORM_PROVIDERS_WITH_KEYS) {
    if (availableProviders.includes(provider)) {
      return provider;
    }
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "No platform-supported provider available for this model",
  });
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
      providers: true,
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

  const availableProviders = modelConfigEntry.providers.map((p) => p.provider);

  if (availableProviders.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No providers configured for this model",
    });
  }

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

  const allAllowedPatterns = await fetchAllowedPatterns(prompt.themeId);

  const libraryListText =
    allAllowedPatterns.length > 0
      ? buildLibraryListForSystemPrompt(allAllowedPatterns)
      : "";

  let selectedProvider: Provider;
  let apiKey: string;

  if (apiKeyId) {
    const keyResult = await getDecryptedUserKey(apiKeyId, userId);
    apiKey = keyResult.apiKey;
    selectedProvider = keyResult.provider;

    if (!availableProviders.includes(selectedProvider)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Your API key provider (${selectedProvider}) does not support this model`,
      });
    }
  } else {
    selectedProvider = selectPlatformProvider(availableProviders);
    const keyResult = getPlatformKey(selectedProvider);
    apiKey = keyResult.apiKey;
  }

  const newGame = await db
    .insert(games)
    .values({
      promptId,
      themeId: prompt.themeId,
      modelProvider: selectedProvider,
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

  const confirmedGameId: string = gameId;

  const systemPrompt = `${COMMON_SYSTEM_PROMPT}\n\n${prompt.theme.systemPrompt}\n\n${libraryListText}`;
  const userPrompt = prompt.content;

  const model = await getProviderModel(modelKey, apiKey, selectedProvider);

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
