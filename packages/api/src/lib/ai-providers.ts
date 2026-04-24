import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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

type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export async function getProviderModel(
  modelName: string,
  apiKey: string,
  provider: Provider,
  customEndpoint?: string,
  reasoningConfig?: { enabled: boolean; effort: ReasoningEffort },
): Promise<LanguageModel> {
  const config = await db.query.modelConfig.findFirst({
    where: eq(modelConfig.modelName, modelName),
  });

  if (!config || !config.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Model not available",
    });
  }

  switch (provider) {
    case "openai":
      return createOpenAI({
        apiKey,
        baseURL: customEndpoint,
      })(modelName);

    case "anthropic":
      return createAnthropic({
        apiKey,
        baseURL: customEndpoint,
      })(modelName);

    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelName);

    case "openrouter": {
      const openrouter = createOpenRouter({
        apiKey,
        headers: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
          "X-Title": process.env.OPENROUTER_APP_NAME ?? "Arcade-Vibe",
        },
      });
      return openrouter(modelName, {
        ...(reasoningConfig?.enabled
          ? {
              reasoning: {
                effort: reasoningConfig.effort,
              },
            }
          : {}),
      });
    }

    case "deepseek":
      return createOpenAICompatible({
        name: "deepseek",
        apiKey,
        baseURL: customEndpoint || "https://api.deepseek.com/v1",
      })(modelName);

    case "glm":
      return createOpenAICompatible({
        name: "glm",
        apiKey,
        baseURL: customEndpoint || "https://api.z.ai/api/paas/v4",
      })(modelName);

    case "moonshot":
      return createOpenAICompatible({
        name: "moonshot",
        apiKey,
        baseURL: customEndpoint || "https://api.moonshot.cn/v1",
      })(modelName);

    case "glm-coding-plan":
      return createOpenAICompatible({
        name: "glm-coding-plan",
        apiKey,
        baseURL: customEndpoint || "https://api.z.ai/api/coding/paas/v4",
      })(modelName);

    case "custom":
      if (!customEndpoint) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Custom provider requires endpoint URL",
        });
      }
      return createOpenAICompatible({
        name: "custom",
        apiKey,
        baseURL: customEndpoint,
      })(modelName);

    default:
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown provider: ${provider}`,
      });
  }
}
