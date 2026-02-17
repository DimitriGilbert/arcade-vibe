export type GenerationStatus = "idle" | "reasoning" | "generating" | "complete" | "error";

export interface GenerationUsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  requestCostUsd?: number;
}

export interface ModelSelection {
  id: string;
  modelKey: string;
  modelName: string;
  tier: string;
  tierName: string;
  creditCost: number;
  apiKeyId: string | null;
  isByok: boolean;
  reasoningEnabled: boolean;
  reasoningMaxTokens: number;
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
