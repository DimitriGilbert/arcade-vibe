import type { GenerationStatus, ModelSelection } from "@/lib/trpc-types";

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

export const MAX_MODELS = 5;

export function generateModelSelectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
