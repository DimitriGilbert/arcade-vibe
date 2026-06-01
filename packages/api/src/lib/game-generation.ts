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
import { deductCredits } from "./credits";
import { decryptApiKey } from "./encryption";
import { uploadToCDN } from "./cdn";
import {
  sanitizeGameCode,
  buildLibraryListForSystemPrompt,
  extractCodeFromMarkdown,
} from "./script-sanitizer";
import { type LanguageModelUsage } from "ai";
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
  reasoningEffort?: "minimal" | "low" | "medium" | "high" | "xhigh";
}

export interface GenerateGameStatusEvent {
  type: "status";
  gameId: string;
  status: "reasoning" | "generating";
}

export interface GenerateGameReasoningEvent {
  type: "reasoning-chunk";
  gameId: string;
  delta: string;
}

export interface GenerateGameChunkEvent {
  type: "chunk";
  gameId: string;
  delta: string;
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
  | GenerateGameReasoningEvent
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
  generationTimeMs?: number;
  timeToFirstTokenMs?: number;
  tokensPerSecond?: number;
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
The app game engine provides and controls the full page boilerplate (DOCTYPE, <html>, <head>, and <body> wrapper).
You must return ONLY the content that belongs inside <body>.

### Do NOT generate:
- <!DOCTYPE html>, <html>, <head>, or <body> tags
- Another window.ArcadeVibe definition

### Do generate:
- <style> tags, HTML elements, <script> tags — nothing else

## Arcade Vibe SDK

Call \`ArcadeVibe.startGame()\` when the player actually starts playing (start button, first movement input, etc.).
Call \`ArcadeVibe.reportScore(score)\` with a positive integer at every game over.
Do not implement your own score reporting via postMessage or fetch.

Other available methods:
- \`ArcadeVibe.startGame()\` — starts playtime tracking for this session
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

Return one contiguous raw HTML snippet representing body content only.
Do NOT return a full HTML document or boilerplate; the app game engine injects that.
Do NOT split output into separate blocks for HTML/CSS/JS.
No markdown fences, no explanations, no comments addressed to the reader.

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

function mapProviderUsageToAiSdkUsage(
  providerUsage: ProviderStreamUsage,
): LanguageModelUsage {
  const inputTokens = providerUsage.inputTokens.total ?? 0;
  const outputTokens = providerUsage.outputTokens.total ?? 0;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputTokenDetails: {
      noCacheTokens: providerUsage.inputTokens.noCache ?? undefined,
      cacheReadTokens: providerUsage.inputTokens.cacheRead ?? undefined,
      cacheWriteTokens: providerUsage.inputTokens.cacheWrite ?? undefined,
    },
    outputTokenDetails: {
      textTokens: providerUsage.outputTokens.text ?? undefined,
      reasoningTokens: providerUsage.outputTokens.reasoning ?? undefined,
    },
    raw: undefined,
  };
}

interface ProviderPromptTextPart {
  type: "text";
  text: string;
}

interface ProviderPromptSystemMessage {
  role: "system";
  content: string;
}

interface ProviderPromptUserMessage {
  role: "user";
  content: ProviderPromptTextPart[];
}

type ProviderPrompt = [ProviderPromptSystemMessage, ProviderPromptUserMessage];

interface ProviderStreamUsage {
  inputTokens: {
    total?: number;
    noCache?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  outputTokens: {
    total?: number;
    text?: number;
    reasoning?: number;
  };
  raw?: Record<string, unknown>;
}

type ProviderStreamPart =
  | { type: "text-delta"; delta: string }
  | { type: "reasoning-delta"; delta: string }
  | { type: "finish"; usage: ProviderStreamUsage }
  | { type: "error"; error: unknown }
  | { type: "unknown"; summary: string };

interface ProviderStreamResult {
  stream: ReadableStream<unknown>;
}

interface ProviderModelWithDoStream {
  doStream(options: {
    prompt: ProviderPrompt;
    providerOptions?: Record<string, unknown>;
  }): PromiseLike<ProviderStreamResult>;
}

interface SerializedProviderError {
  name?: string;
  message: string;
  code?: string;
  status?: number;
  statusCode?: number;
  type?: string;
  cause?: string;
  raw?: string;
}

interface GenerationFailureDetails extends Record<string, unknown> {
  stage: "provider-stream" | "stream-validation" | "post-processing";
  message: string;
  gameId: string;
  promptId: string;
  modelKey: string;
  provider: Provider;
  providerError?: SerializedProviderError;
  streamState?: {
    textLength: number;
    reasoningLength: number;
    finishSeen: boolean;
    usageSeen: boolean;
    unknownPartCount: number;
    firstUnknownParts: string[];
  };
}

class GenerationFailure extends Error {
  readonly details: GenerationFailureDetails;

  constructor(details: GenerationFailureDetails) {
    super(details.message);
    this.name = "GenerationFailure";
    this.details = details;
  }
}

function getRecordString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getRecordNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function summarizeUnknown(value: unknown): string {
  if (typeof value === "string") return value.slice(0, 2000);
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value);
  }
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`.slice(0, 2000);
  }
  try {
    return JSON.stringify(value).slice(0, 2000);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function serializeProviderError(error: unknown): SerializedProviderError {
  if (error instanceof Error) {
    const serialized: SerializedProviderError = {
      name: error.name,
      message: error.message || "Provider stream failed",
    };

    if (error.cause !== undefined) {
      serialized.cause = summarizeUnknown(error.cause);
    }

    if (isRecord(error)) {
      serialized.code = getRecordString(error, "code");
      serialized.status = getRecordNumber(error, "status");
      serialized.statusCode = getRecordNumber(error, "statusCode");
      serialized.type = getRecordString(error, "type");
    }

    return serialized;
  }

  if (isRecord(error)) {
    const message =
      getRecordString(error, "message") ??
      getRecordString(error, "error") ??
      "Provider stream failed";
    return {
      message,
      code: getRecordString(error, "code"),
      status: getRecordNumber(error, "status"),
      statusCode: getRecordNumber(error, "statusCode"),
      type: getRecordString(error, "type"),
      raw: summarizeUnknown(error),
    };
  }

  return {
    message: summarizeUnknown(error) || "Provider stream failed",
  };
}

function parseProviderStreamPart(value: unknown): ProviderStreamPart {
  if (!isRecord(value)) {
    return { type: "unknown", summary: summarizeUnknown(value) };
  }

  const type = value["type"];
  if (type === "text-delta") {
    const delta = value["delta"];
    return typeof delta === "string"
      ? { type, delta }
      : { type: "unknown", summary: summarizeUnknown(value) };
  }

  if (type === "reasoning-delta") {
    const delta = value["delta"];
    return typeof delta === "string"
      ? { type, delta }
      : { type: "unknown", summary: summarizeUnknown(value) };
  }

  if (type === "finish") {
    const usage = value["usage"];
    return isProviderStreamUsage(usage)
      ? { type, usage }
      : { type: "unknown", summary: summarizeUnknown(value) };
  }

  if (type === "error") {
    return { type, error: value["error"] ?? value };
  }

  return { type: "unknown", summary: summarizeUnknown(value) };
}

function isProviderStreamUsage(value: unknown): value is ProviderStreamUsage {
  if (!isRecord(value)) return false;
  return isRecord(value["inputTokens"]) && isRecord(value["outputTokens"]);
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
          where: and(
            inArray(allowedLibraryPatterns.id, themePatternIds),
            eq(allowedLibraryPatterns.status, "active"),
          ),
        })
      : [];

  const seen = new Set<string>();
  return [...globalPatterns, ...additionalPatterns].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
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
    // deductCredits handles the balance check atomically with locking
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
      name: options.name ?? prompt.title ?? null,
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
  let userPrompt = prompt.content;
  if (options.name?.trim()) {
    userPrompt += `\n\nGame name: ${options.name.trim()}`;
  }

  const model = await getProviderModel(
    modelKey,
    apiKey,
    selectedProvider,
    undefined,
    { enabled: options.reasoningEnabled ?? true, effort: options.reasoningEffort ?? "low" },
  );

  let finishedText = "";
  let finishedTotalUsage: LanguageModelUsage | undefined;

  async function* generateStream(): AsyncGenerator<GenerateGameEvent> {
    let hasEmittedGenerating = false;
    let bufferedCodeDelta = "";
    let bufferedReasoningDelta = "";
    let totalReasoningLength = 0;
    let finishSeen = false;
    let unknownPartCount = 0;
    const firstUnknownParts: string[] = [];
    const STREAM_FLUSH_INTERVAL_MS = 16;
    let lastFlushAt = Date.now();
    let streamStartTime = 0;
    let firstTokenTime = 0;
    let generationEndTime = 0;

    const buildStreamState = () => ({
      textLength: finishedText.length,
      reasoningLength: totalReasoningLength,
      finishSeen,
      usageSeen: finishedTotalUsage !== undefined,
      unknownPartCount,
      firstUnknownParts,
    });

    const buildFailure = (
      stage: GenerationFailureDetails["stage"],
      message: string,
      providerError?: SerializedProviderError,
    ) =>
      new GenerationFailure({
        stage,
        message,
        gameId: confirmedGameId,
        promptId,
        modelKey,
        provider: selectedProvider,
        providerError,
        streamState: buildStreamState(),
      });

    const flushBufferedDeltas = async function* (): AsyncGenerator<GenerateGameEvent> {
      if (bufferedReasoningDelta.length > 0) {
        yield {
          type: "reasoning-chunk",
          gameId: confirmedGameId,
          delta: bufferedReasoningDelta,
        };
        bufferedReasoningDelta = "";
      }

      if (bufferedCodeDelta.length > 0) {
        yield {
          type: "chunk",
          gameId: confirmedGameId,
          delta: bufferedCodeDelta,
        };
        bufferedCodeDelta = "";
      }
    };

    try {
      if (options.reasoningEnabled ?? true) {
        yield {
          type: "status",
          gameId: confirmedGameId,
          status: "reasoning",
        };
      }

      // Legacy streamText path (kept as comment for quick rollback):
      // const result = streamText({
      //   model,
      //   messages,
      //   experimental_include: { requestBody: false },
      //   experimental_transform: smoothStream({ delayInMs: null, chunking: "word" }),
      //   onFinish(event) {
      //     finishedText = event.text;
      //     finishedTotalUsage = event.totalUsage;
      //   },
      // });
      // for await (const chunk of result.fullStream) {
      //   if (chunk.type === "reasoning-delta") bufferedReasoningDelta += chunk.text;
      //   if (chunk.type === "text-delta") { bufferedCodeDelta += chunk.text; }
      // }

      const providerModel = model as unknown as ProviderModelWithDoStream;
      const providerPrompt: ProviderPrompt = [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: userPrompt }],
        },
      ];

      streamStartTime = Date.now();
      const providerStreamResult = await providerModel.doStream({
        prompt: providerPrompt,
        providerOptions: {
          openrouter: {
            ...(options.reasoningEnabled ?? true
              ? {
                  reasoning: {
                    effort: options.reasoningEffort ?? "low",
                  },
                }
              : {}),
          },
        } as Record<string, unknown>,
      });

      const reader = providerStreamResult.stream.getReader();
      try {
        while (true) {
          let readResult: Awaited<ReturnType<typeof reader.read>>;
          try {
            readResult = await reader.read();
          } catch (error) {
            const providerError = serializeProviderError(error);
            throw buildFailure(
              "provider-stream",
              providerError.message,
              providerError,
            );
          }

          if (readResult.done) {
            break;
          }

          const part = parseProviderStreamPart(readResult.value);
          if (part.type === "reasoning-delta") {
            if (firstTokenTime === 0) firstTokenTime = Date.now();
            totalReasoningLength += part.delta.length;
            if (options.reasoningEnabled ?? true) {
              bufferedReasoningDelta += part.delta;
            }
          } else if (part.type === "text-delta") {
            if (firstTokenTime === 0) firstTokenTime = Date.now();
            if (!hasEmittedGenerating) {
              hasEmittedGenerating = true;
              yield* flushBufferedDeltas();
              yield {
                type: "status",
                gameId: confirmedGameId,
                status: "generating",
              };
            }

            bufferedCodeDelta += part.delta;
            finishedText += part.delta;
          } else if (part.type === "finish") {
            finishSeen = true;
            finishedTotalUsage = mapProviderUsageToAiSdkUsage(part.usage);
          } else if (part.type === "error") {
            const providerError = serializeProviderError(part.error);
            throw buildFailure(
              "provider-stream",
              providerError.message,
              providerError,
            );
          } else if (part.type === "unknown") {
            unknownPartCount++;
            if (firstUnknownParts.length < 5) {
              firstUnknownParts.push(part.summary);
            }
          }

          const now = Date.now();
          if (now - lastFlushAt >= STREAM_FLUSH_INTERVAL_MS) {
            yield* flushBufferedDeltas();
            lastFlushAt = now;
          }
        }
        generationEndTime = Date.now();
      } finally {
        reader.releaseLock();
      }
      yield* flushBufferedDeltas();
      const fullCode = finishedText;
      if (fullCode.length === 0) {
        const validationMessage = firstUnknownParts.length > 0
          ? "Provider returned stream parts that Arcade Vibe does not understand"
          : !finishSeen
            ? "Provider stream ended before returning game code or a finish event"
            : totalReasoningLength > 0
              ? "Provider returned reasoning but no playable game code"
              : "Provider finished without returning game code";

        throw buildFailure("stream-validation", validationMessage);
      }

      const normalizedFullCode = fullCode.trim();
      const extractedCode = extractCodeFromMarkdown(fullCode);
      const codeForSanitization =
        extractedCode.length > 0 ? extractedCode : normalizedFullCode;

      const sanitizationResult = sanitizeGameCode(codeForSanitization, allAllowedPatterns);

      if (sanitizationResult.blockedUrls.length > 0) {
        console.warn(
          `Blocked ${sanitizationResult.blockedUrls.length} external script URLs`,
        );
      }

      const usage = finishedTotalUsage;
      if (!usage) {
        throw buildFailure(
          "stream-validation",
          "Provider returned game code without usage metrics",
        );
      }
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

      const generationTime = generationEndTime > 0 ? generationEndTime - streamStartTime : undefined;
      const ttft = firstTokenTime > 0 ? firstTokenTime - streamStartTime : undefined;
      const tokPerSec = (outputTokens > 0 && generationEndTime > 0 && firstTokenTime > 0)
        ? outputTokens / ((generationEndTime - firstTokenTime) / 1000)
        : undefined;

      const usageMetrics: GenerateGameUsageMetrics = {
        inputTokens,
        outputTokens,
        totalTokens,
        reasoningTokens,
        cachedInputTokens,
        requestCostUsd,
        generationTimeMs: generationTime,
        timeToFirstTokenMs: ttft,
        tokensPerSecond: tokPerSec,
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
          generationTimeMs: generationTime ?? null,
          timeToFirstTokenMs: ttft ?? null,
          tokensPerSecond: tokPerSec ?? null,
          generatedAt: new Date(),
          status: "completed",
          blockedScriptUrls: sanitizationResult.blockedUrls,
          sanitizationApplied: sanitizationResult.blockedUrls.length > 0,
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
      const failureDetails: GenerationFailureDetails = error instanceof GenerationFailure
        ? error.details
        : {
            stage: "post-processing",
            message: error instanceof Error ? error.message : "Generation failed",
            gameId: confirmedGameId,
            promptId,
            modelKey,
            provider: selectedProvider,
            providerError: serializeProviderError(error),
            streamState: buildStreamState(),
          };

      console.error("[game-generation] Generation failed", failureDetails);

      // Update game status to failed
      await db
        .update(games)
        .set({
          status: "failed",
          failureReason: failureDetails.message,
          failureDetails,
          updatedAt: new Date(),
        })
        .where(eq(games.id, confirmedGameId));

      yield {
        type: "error",
        gameId: confirmedGameId,
        error: failureDetails.message,
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
