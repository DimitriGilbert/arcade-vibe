import type { ModelSelection, GenerationStatus } from "@/lib/trpc-types";
import { GENERATION_CONCURRENCY_LIMIT } from "@/lib/generation-limits";

export type { ModelSelection, GenerationStatus };

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

export const DEFAULT_MAX_MODELS = 4;
export const PREMIUM_MAX_MODELS = 8;
export const MAX_MODELS = DEFAULT_MAX_MODELS;

export { GENERATION_CONCURRENCY_LIMIT };

export function generateModelSelectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
