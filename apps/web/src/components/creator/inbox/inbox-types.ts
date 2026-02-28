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

export type {
  GenerationStatus,
  ModelSelection,
  ModelConfig,
  TierCost,
  ApiKey,
  ModelMetadata,
};

export { GENERATION_CONCURRENCY_LIMIT, MAX_MODELS, generateModelSelectionId };

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
