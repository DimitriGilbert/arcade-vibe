import type { GenerationStatus, ModelSelection } from "@/lib/model-types";
import {
  GENERATION_CONCURRENCY_LIMIT,
  MAX_MODELS,
  generateModelSelectionId,
  type ModelConfig,
  type TierCost,
  type ApiKey,
  type ModelMetadata,
} from "@/lib/model-types";

export type { GenerationStatus, ModelSelection };

export type { ModelConfig, TierCost, ApiKey, ModelMetadata };

export interface PersistedWorkbenchState {
  promptContent: string;
  gameName: string;
  selectedTheme: string;
  selectedModels: ModelSelection[];
  timestamp: number;
}

export type RightPanelTab = "history" | "models" | "settings";

export const WORKBENCH_STORAGE_KEY = "arcade-vibe-creator-workbench";

export { GENERATION_CONCURRENCY_LIMIT, MAX_MODELS, generateModelSelectionId };
