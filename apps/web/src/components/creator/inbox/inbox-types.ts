/**
 * Shared types for the Inbox prompt editor
 */

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

export interface ModelConfig {
  id: string;
  providers: string[];
  modelName: string;
  tier: string;
  tierName: string;
  maxTokens: number;
  supportsImages: boolean;
}

export interface TierCost {
  id: string;
  slug: string;
  name: string;
  creditCost: number;
  description: string | null;
  scoreMultiplier: number;
  displayOrder: number;
  colorClass: string | null;
}

export interface ApiKey {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface ModelMetadata {
  models: ModelConfig[];
  tierCosts: Record<string, number>;
  tierCostsArray: TierCost[];
  providers: string[];
  tiers: string[];
}

export const MAX_MODELS = 4;

export function generateModelSelectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function toModelConfig(data: {
  id: string;
  providers: string[];
  modelName: string;
  tier: string;
  tierName: string;
  maxTokens: number;
  supportsImages: boolean;
}): ModelConfig {
  return data;
}
