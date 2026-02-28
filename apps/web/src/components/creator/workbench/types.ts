/**
 * Workbench Types - Shared types for the workbench components
 * All entity types are imported from @/lib/trpc-types
 */

import type { GenerationStatus } from "@/components/editor/model-types";
import { GENERATION_CONCURRENCY_LIMIT } from "@/lib/generation-limits";

export type { GenerationStatus };

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

export interface PersistedWorkbenchState {
  promptContent: string;
  gameName: string;
  selectedTheme: string;
  selectedModels: ModelSelection[];
  timestamp: number;
}

export type RightPanelTab = "history" | "models" | "settings";

export const MAX_MODELS = 4;
export { GENERATION_CONCURRENCY_LIMIT };
export const WORKBENCH_STORAGE_KEY = "arcade-vibe-creator-workbench";
