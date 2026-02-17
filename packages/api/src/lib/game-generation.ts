import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { apiKeys, modelConfig } from "@arcade-vibe/db/schema/models";
import {
  allowedLibraryPatterns,
  themeAllowedPatterns,
} from "@arcade-vibe/db/schema/library-patterns";
import type { ThemeMediaConfig } from "@arcade-vibe/db/schema/media-types";
import { getProviderModel } from "./ai-providers";
import { deductCredits, getValidCreditBalance } from "./credits";
import { decryptApiKey } from "./encryption";
import { uploadToCDN } from "./cdn";
import {
  sanitizeGameCode,
  buildLibraryListForSystemPrompt,
  extractCodeFromMarkdown,
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
  name?: string;
  mediaUrls?: Record<string, string>;
  reasoningEnabled?: boolean;
  reasoningMaxTokens?: number;
}

export interface GenerateGameStatusEvent {
  type: "status";
  gameId: string;
  status: "reasoning" | "generating";
}

export interface GenerateGameChunkEvent {
  type: "chunk";
  gameId: string;
  code: string;
}

export interface GenerateGameCompleteEvent {
  type: "complete";
  gameId: string;
  assetUrl: string;
  tokenUsage: number;
  usage: GenerateGameUsageMetrics;
}

export interface GenerateGameErrorEvent {
  type: "error";
  gameId: string;
  error: string;
}

export type GenerateGameEvent =
  | GenerateGameStatusEvent
  | GenerateGameChunkEvent
  | GenerateGameCompleteEvent
  | GenerateGameErrorEvent;

export interface GenerateGameResult {
  gameId: string;
  stream: AsyncGenerator<GenerateGameEvent>;
}

export interface GenerateGameUsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  requestCostUsd?: number;
}

export interface PromptWithTheme {
  id: string;
  content: string;
  themeId: string;
  visibility: string;
  theme: {
    id: string;
    systemPrompt: string;
    mediaConfig: ThemeMediaConfig | null;
  };
}

// ============================================================================
// Common System Prompt (injected for ALL themes)
// ============================================================================

// const COMMON_SYSTEM_PROMPT = `## Output Format

// Your code will be injected inside the <body> tag of an existing HTML page. The Arcade Vibe SDK is already loaded in the page header.

// ### Do NOT generate:
// - <!DOCTYPE html>, <html>, <head>, or <body> tags
// - Another window.ArcadeVibe definition

// ### Do generate:
// - <style> tags, HTML elements, <script> tags — nothing else

// ## Arcade Vibe SDK

// Call \`ArcadeVibe.reportScore(score)\` with a positive integer whenever the player reaches a game over or completes a level. Do not implement your own score reporting via postMessage or fetch.

// Other available methods:
// - \`ArcadeVibe.getPlaytime()\` — current session duration in seconds
// - \`ArcadeVibe.isReady()\` — returns true if SDK is initialized

// ## Robustness Rules

// These are non-negotiable:
// - Wrap all JS in a \`DOMContentLoaded\` listener to avoid race conditions
// - Use \`requestAnimationFrame\` for the game loop — never \`setInterval\` for rendering
// - Declare all variables with \`const\` or \`let\`, no implicit globals
// - The outer layout must use responsive sizing (100vw / 100vh or percentages) — no fixed pixel dimensions

// ## Output Rules

// Return only the raw HTML snippet. No markdown fences, no explanations, no comments addressed to the reader.

// ## Every Game Must Have

// 1. **Score** — visible at all times, updated in real time
// 2. **Lives or health** — the player can fail and reach a game over state
// 3. **Progressive difficulty** — the game gets meaningfully harder over time (speed, frequency, complexity)
// 4. **A complete game loop** — Start screen → Gameplay → Game Over → Restart, all accessible without a page reload
// 5. **Instructions** — one or two lines on the start screen explaining how to play
// `;

const COMMON_SYSTEM_PROMPT = `## Output Format

Your code will be injected inside the <body> tag of an existing HTML page. The Arcade Vibe SDK is already loaded in the page header.

### Do NOT generate:
- <!DOCTYPE html>, <html>, <head>, or <body> tags
- Another window.ArcadeVibe definition

### Do generate:
- <style> tags, HTML elements, <script> tags — nothing else

## Arcade Vibe SDK

Call \`ArcadeVibe.reportScore(score)\` with a positive integer at every game over.
Do not implement your own score reporting via postMessage or fetch.

Other available methods:
- \`ArcadeVibe.getPlaytime()\` — session duration in seconds
- \`ArcadeVibe.isReady()\` — returns true if SDK is initialized

## Robustness Rules — These are non-negotiable

### Initialization order (CRITICAL)
- ALL static HTML (canvases, UI elements, overlays, buttons) must be written directly as HTML markup — NOT created via JavaScript at runtime
- JavaScript may only read or modify elements that already exist in the markup above it
- NEVER query DOM elements (getElementById, querySelector, etc.) before they are defined in the HTML
- Wrap ALL JavaScript in: \`document.addEventListener('DOMContentLoaded', () => { ... })\`
- This is the correct form — do NOT write \`DOMContentLoaded = function\` or any other variant

### Game loop
- Use \`requestAnimationFrame\` for the game loop — NEVER \`setInterval\` for rendering
- Cap delta time: \`const delta = Math.min((now - last) / 1000, 0.05)\` to prevent spiral-of-death on tab refocus

### Code quality
- Declare all variables with \`const\` or \`let\` — never implicit globals
- Never call \`scene.add()\`, \`appendChild()\`, or any DOM/scene insertion method on an object that already exists in the scene — only call it once, at creation time
- Use only inline assets — Canvas API, CSS shapes, SVG, Unicode/emoji. External URLs are ONLY allowed if explicitly listed in the "Available Images" section below.
- Do not use APIs that require browser permissions (camera, microphone, geolocation, notifications)
- The layout must use responsive sizing (100vw / 100vh or percentages) — no fixed pixel dimensions for the outer container

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

function buildMediaPromptSection(
  mediaConfig: ThemeMediaConfig | null,
  userMediaUrls: Record<string, string> | undefined,
): string {
  if (!mediaConfig?.enabled || mediaConfig.imageSlots.length === 0) {
    return "";
  }

  const resolvedSlots = mediaConfig.imageSlots
    .map((slot) => {
      const url = userMediaUrls?.[slot.name] ?? slot.defaultUrl;
      return url ? { name: slot.name, label: slot.label, url } : null;
    })
    .filter(
      (slot): slot is { name: string; label: string; url: string } =>
        slot !== null,
    );

  if (resolvedSlots.length === 0) return "";

  const imageList = resolvedSlots
    .map((s) => `- ${s.label} (${s.name}): ${s.url}`)
    .join("\n");

  return `## Available Images

You may use these pre-approved image URLs in your game:
${imageList}

Use them with \`<img src="URL">\` or in CSS/JavaScript as needed.
Do NOT use any other external image URLs.`;
}

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

const getPlatformKey = (
  provider: Provider,
): { apiKey: string; provider: Provider } => {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function getProviderReportedCost(usageRaw: unknown): number | undefined {
  if (!isRecord(usageRaw)) return undefined;

  const directCostKeys = ["totalCost", "total_cost", "requestCost", "request_cost", "cost"];
  for (const key of directCostKeys) {
    const value = parseNumber(usageRaw[key]);
    if (value !== undefined) {
      return value;
    }
  }

  const nestedUsage = usageRaw["usage"];
  if (isRecord(nestedUsage)) {
    for (const key of directCostKeys) {
      const value = parseNumber(nestedUsage[key]);
      if (value !== undefined) {
        return value;
      }
    }
  }

  return undefined;
}

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
    with: {
      theme: {
        columns: {
          id: true,
          systemPrompt: true,
          mediaConfig: true,
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

  // Verify prompt visibility if required
  if (requirePublicPrompt && prompt.visibility !== "public") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only run public prompts",
    });
  }

  // GL-011: Validate mediaUrls against theme.mediaConfig.imageSlots
  if (options.mediaUrls && prompt.theme.mediaConfig?.enabled) {
    const allowedSlotNames = prompt.theme.mediaConfig.imageSlots.map(
      (slot) => slot.name,
    );
    const providedKeys = Object.keys(options.mediaUrls);
    const invalidKeys = providedKeys.filter(
      (key) => !allowedSlotNames.includes(key),
    );
    if (invalidKeys.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid media slot names: ${invalidKeys.join(", ")}. Allowed slots: ${allowedSlotNames.join(", ")}`,
      });
    }
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
  const modelCostPer1k = Number(modelConfigEntry.costPer1kTokens);

  if (availableProviders.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No providers configured for this model",
    });
  }

  if (!apiKeyId) {
    const creditCost = tierCost.creditCost;
    const userCredits = await getValidCreditBalance(userId);
    console.log("[DEBUG] Credit check:", { userId, userCredits, creditCost });

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
      name: options.name,
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

  const mediaPromptSection = buildMediaPromptSection(
    prompt.theme.mediaConfig,
    options.mediaUrls,
  );

  const systemPrompt = [
    COMMON_SYSTEM_PROMPT,
    prompt.theme.systemPrompt,
    mediaPromptSection,
    libraryListText,
  ]
    .filter(Boolean)
    .join("\n\n");
  const userPrompt = prompt.content;

  const model = await getProviderModel(
    modelKey,
    apiKey,
    selectedProvider,
    undefined,
    { enabled: options.reasoningEnabled ?? true, maxTokens: options.reasoningMaxTokens ?? 2000 },
  );

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
    let hasEmittedGenerating = false;

    try {
      // Emit reasoning status if enabled
      if (options.reasoningEnabled ?? true) {
        yield {
          type: "status",
          gameId: confirmedGameId,
          status: "reasoning",
        };
      }

      // Stream chunks
      for await (const chunk of result.textStream) {
        // Emit generating status on first chunk
        if (!hasEmittedGenerating) {
          hasEmittedGenerating = true;
          yield {
            type: "status",
            gameId: confirmedGameId,
            status: "generating",
          };
        }

        fullCode += chunk;

        yield {
          type: "chunk",
          gameId: confirmedGameId,
          code: fullCode,
        };
      }

      // GL-008: Sanitize FIRST, then upload to CDN
      // 8. Sanitize the generated code
      const extractedCode = extractCodeFromMarkdown(fullCode);
      const sanitizationResult = sanitizeGameCode(
        extractedCode,
        allAllowedPatterns,
      );

      if (sanitizationResult.blockedUrls.length > 0) {
        console.warn(
          `Blocked ${sanitizationResult.blockedUrls.length} external script URLs`,
        );
      }

      if (sanitizationResult.dangerousPatternsFound > 0) {
        console.warn(
          `Blocked ${sanitizationResult.dangerousPatternsFound} dangerous inline script patterns`,
        );
      }

      // Get token usage from the result
      const usage = await result.usage;
      const inputTokens = usage.inputTokens ?? 0;
      const outputTokens = usage.outputTokens ?? 0;
      const totalTokens = usage.totalTokens ?? inputTokens + outputTokens;
      const reasoningTokens = usage.outputTokenDetails.reasoningTokens ?? undefined;
      const cachedInputTokens = usage.inputTokenDetails.cacheReadTokens ?? undefined;

      const providerReportedCost = getProviderReportedCost(usage.raw);
      const estimatedCost =
        Number.isFinite(modelCostPer1k) && totalTokens > 0
          ? (totalTokens / 1000) * modelCostPer1k
          : undefined;
      const requestCostUsd = providerReportedCost ?? estimatedCost;

      const usageMetrics: GenerateGameUsageMetrics = {
        inputTokens,
        outputTokens,
        totalTokens,
        reasoningTokens,
        cachedInputTokens,
        requestCostUsd,
      };

      // 9. Upload SANITIZED code to CDN
      let assetUrl: string | null = null;
      try {
        assetUrl = await uploadToCDN(
          sanitizationResult.sanitizedHtml,
          confirmedGameId,
        );
      } catch (error) {
        // GL-009: Store gameData even on CDN failure
        console.error("CDN upload failed, storing gameData locally:", error);
      }

      // 10. Update game status to completed with token usage
      // GL-009: Always store gameData, even if CDN upload failed
      await db
        .update(games)
        .set({
          gameData: sanitizationResult.sanitizedHtml,
          imageUrl: assetUrl,
          tokenUsage: totalTokens,
          inputTokens,
          outputTokens,
          reasoningTokens,
          cachedInputTokens,
          requestCostUsd:
            requestCostUsd !== undefined ? requestCostUsd.toFixed(6) : null,
          generatedAt: new Date(),
          status: "completed",
          blockedScriptUrls: sanitizationResult.blockedUrls,
          sanitizationApplied:
            sanitizationResult.blockedUrls.length > 0 ||
            sanitizationResult.dangerousPatternsFound > 0,
        })
        .where(eq(games.id, confirmedGameId));

      // Yield final completion event
      yield {
        type: "complete",
        gameId: confirmedGameId,
        assetUrl: assetUrl ?? "",
        tokenUsage: totalTokens,
        usage: usageMetrics,
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
