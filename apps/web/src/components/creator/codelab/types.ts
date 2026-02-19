/**
 * Codelab types - Type definitions for the Jupyter-style prompt editor
 */

import type { GenerationStatus } from "@/components/editor/model-types";

/**
 * Model selection for codelab
 */
export interface CodelabModelSelection {
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

/**
 * Single output from a model generation
 */
export interface CodelabOutput {
  modelSelectionId: string;
  modelKey: string;
  modelName: string;
  status: GenerationStatus;
  code: string;
  reasoning?: string;
  gameId: string | null;
  error?: string;
}

/**
 * A run cell - represents a single generation run
 * Contains the prompt content, selected models, and outputs
 */
export interface CodelabRunCell {
  id: string;
  promptContent: string;
  gameName: string;
  themeId: string;
  selectedModels: CodelabModelSelection[];
  outputs: Record<string, CodelabOutput>;
  createdAt: number;
  promptId?: string;
}

/**
 * Persisted state for codelab
 */
export interface CodelabPersistedState {
  currentPromptContent: string;
  currentGameName: string;
  currentThemeId: string;
  currentSelectedModels: CodelabModelSelection[];
  runHistory: CodelabRunCell[];
  timestamp: number;
}

/**
 * Model metadata from API
 */
export interface CodelabModelMetadata {
  models: Array<{
    id: string;
    providers: string[];
    modelName: string;
    tier: string;
    tierName: string;
    maxTokens: number;
    supportsImages: boolean;
  }>;
  tierCosts: Record<string, number>;
  tierCostsArray: Array<{
    id: string;
    slug: string;
    name: string;
    creditCost: number;
    description: string | null;
    scoreMultiplier: number;
    displayOrder: number;
    colorClass: string | null;
  }>;
  providers: string[];
  tiers: string[];
}

/**
 * API key for BYOK
 */
export interface CodelabApiKey {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * Theme for dropdown
 */
export interface CodelabTheme {
  id: string;
  title: string;
}

/**
 * Prompt for list
 */
export interface CodelabPrompt {
  id: string;
  content: string;
  version: number;
  updatedAt: string;
  visibility?: "private" | "public" | "public_on_freeze";
}

/**
 * Version for history
 */
export interface CodelabVersion {
  id: string;
  version: number;
  createdAt: string;
}

/**
 * Generation chunk from streaming API
 */
export type GenerationChunk =
  | { type: "status"; status: GenerationStatus }
  | { type: "reasoning-chunk"; delta: string }
  | { type: "chunk"; delta: string }
  | { type: "complete"; gameId: string }
  | { type: "error"; error: string };
