import type { GenerationStatus, ModelSelection } from "@/lib/model-types";
import { MAX_MODELS, generateModelSelectionId } from "@/lib/model-types";

export type { GenerationStatus, ModelSelection };

export interface GenerationUsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  requestCostUsd?: number;
}

export interface GenerationResult {
  modelSelectionId: string;
  modelKey: string;
  status: GenerationStatus;
  code: string;
  reasoning?: string;
  gameId: string | null;
  usage?: GenerationUsageMetrics;
  error?: string;
}

export { MAX_MODELS, generateModelSelectionId };
