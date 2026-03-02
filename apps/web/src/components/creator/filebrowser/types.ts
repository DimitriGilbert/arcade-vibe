import type { Visibility, GameStatus } from "@/lib/trpc-types";
import type { ModelSelection, GenerationStatus } from "@/lib/model-types";
import { GENERATION_CONCURRENCY_LIMIT, MAX_MODELS } from "@/lib/model-types";

export type { Visibility, ModelSelection, GenerationStatus };

export interface ThemeNode {
  id: string;
  title: string;
  status: string;
  isActive: boolean;
}

export interface PromptNode {
  id: string;
  title: string | null;
  content: string;
  version: number;
  visibility: Visibility;
  updatedAt: string;
  themeId: string;
}

export interface RunNode {
  id: string;
  name: string | null;
  modelName: string | null;
  status: GameStatus;
  createdAt: string;
  gameId: string | null;
  isSubmitted: boolean;
  promptId: string;
}

export type SelectionType = "theme" | "prompt" | "run" | "new-prompt" | null;

export interface FilebrowserSelection {
  type: SelectionType;
  themeId: string | null;
  promptId: string | null;
  runId: string | null;
}

export interface PersistedFilebrowserState {
  promptContent: string;
  promptTitle: string;
  gameName: string;
  selectedTheme: string;
  selectedModels: ModelSelection[];
  selection: FilebrowserSelection;
  expandedThemes: string[];
  timestamp: number;
}

export const STORAGE_KEY = "arcade-vibe-creator-filebrowser";
export const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export { GENERATION_CONCURRENCY_LIMIT, MAX_MODELS };
