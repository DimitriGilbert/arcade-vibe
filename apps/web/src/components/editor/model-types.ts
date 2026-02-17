export type GenerationStatus = "idle" | "reasoning" | "generating" | "complete" | "error";

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
  gameId: string | null;
  error?: string;
}

export const MAX_MODELS = 5;

export function generateModelSelectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
