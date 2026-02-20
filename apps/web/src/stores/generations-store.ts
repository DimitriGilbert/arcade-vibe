import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  GenerationStatus,
  GenerationResult,
  GenerationUsageMetrics,
} from "@/components/editor/model-types";

/**
 * Generations store optimized for fine-grained subscriptions.
 * Instead of storing a Map, we store individual entries so components
 * can subscribe to specific generation IDs without re-rendering on unrelated changes.
 */

export interface GenerationEntry {
  modelSelectionId: string;
  modelKey: string;
  status: GenerationStatus;
  code: string;
  reasoning?: string;
  gameId: string | null;
  usage?: GenerationUsageMetrics;
  error?: string;
}

interface GenerationsState {
  // State: Record of generation entries by ID (not a Map)
  generations: Record<string, GenerationEntry>;

  // Actions
  setGeneration: (id: string, generation: GenerationEntry) => void;
  updateGenerationStatus: (id: string, status: GenerationStatus) => void;
  updateGenerationCode: (id: string, code: string) => void;
  updateGenerationReasoning: (id: string, reasoning: string) => void;
  updateGenerationGameId: (
    id: string,
    gameId: string,
    usage?: GenerationUsageMetrics,
  ) => void;
  updateGenerationError: (id: string, error: string) => void;
  removeGeneration: (id: string) => void;
  clearGenerations: () => void;
  setMultipleGenerations: (generations: Record<string, GenerationEntry>) => void;
}

export const useGenerationsStore = create<GenerationsState>((set) => ({
  generations: {},

  setGeneration: (id, generation) =>
    set((state) => ({
      generations: {
        ...state.generations,
        [id]: generation,
      },
    })),

  updateGenerationStatus: (id, status) =>
    set((state) => {
      const existing = state.generations[id];
      if (!existing) return state;
      return {
        generations: {
          ...state.generations,
          [id]: { ...existing, status },
        },
      };
    }),

  updateGenerationCode: (id, delta) =>
    set((state) => {
      const existing = state.generations[id];
      if (!existing) return state;
      return {
        generations: {
          ...state.generations,
          [id]: { ...existing, code: existing.code + delta },
        },
      };
    }),

  updateGenerationReasoning: (id, delta) =>
    set((state) => {
      const existing = state.generations[id];
      if (!existing) return state;
      return {
        generations: {
          ...state.generations,
          [id]: { ...existing, reasoning: (existing.reasoning ?? "") + delta },
        },
      };
    }),

  updateGenerationGameId: (id, gameId, usage) =>
    set((state) => {
      const existing = state.generations[id];
      if (!existing) return state;
      return {
        generations: {
          ...state.generations,
          [id]: { ...existing, status: "complete", gameId, usage },
        },
      };
    }),

  updateGenerationError: (id, error) =>
    set((state) => {
      const existing = state.generations[id];
      if (!existing) return state;
      return {
        generations: {
          ...state.generations,
          [id]: { ...existing, status: "error", error },
        },
      };
    }),

  removeGeneration: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.generations;
      return { generations: rest };
    }),

  clearGenerations: () => set({ generations: {} }),

  setMultipleGenerations: (generations) => set({ generations }),
}));

// Selectors for fine-grained subscriptions
// These allow components to subscribe only to the data they need

/**
 * Get a single generation by ID.
 * Use this selector to avoid re-renders when other generations change.
 */
export const useGenerationById = (id: string | null | undefined): GenerationEntry | undefined => {
  return useGenerationsStore((state) => (id ? state.generations[id] : undefined));
};

/**
 * Get the status of a single generation.
 * Use this for status indicators that don't need the full generation data.
 */
export const useGenerationStatus = (id: string | null | undefined): GenerationStatus | undefined => {
  return useGenerationsStore((state) => (id ? state.generations[id]?.status : undefined));
};

/**
 * Get the code of a single generation.
 * Use this for code viewers that only need the code.
 */
export const useGenerationCode = (id: string | null | undefined): string => {
  return useGenerationsStore((state) => (id ? state.generations[id]?.code ?? "" : ""));
};

/**
 * Get only the game ID of a single generation.
 * Use this when callers should not re-render for code/reasoning updates.
 */
export const useGenerationGameId = (id: string | null | undefined): string | null => {
  return useGenerationsStore((state) => (id ? state.generations[id]?.gameId ?? null : null));
};

/**
 * Get all generation IDs.
 * Uses shallow comparison to avoid infinite loops.
 */
export const useGenerationIds = (): string[] => {
  return useGenerationsStore(
    useShallow((state) => Object.keys(state.generations)),
  );
};

/**
 * Get count of completed or errored generations.
 * Returns a primitive number, safe for React 18.
 */
export const useCompletedCount = (): number => {
  return useGenerationsStore((state) => {
    const entries = Object.values(state.generations);
    return entries.filter((g) => g.status === "complete" || g.status === "error").length;
  });
};

/**
 * Get total generation count.
 * Returns a primitive number, safe for React 18.
 */
export const useTotalCount = (): number => {
  return useGenerationsStore((state) => Object.keys(state.generations).length);
};

/**
 * Get all generations as an array.
 * Uses shallow comparison to avoid unnecessary re-renders.
 */
export const useAllGenerations = (): GenerationEntry[] => {
  return useGenerationsStore(
    useShallow((state) => Object.values(state.generations)),
  );
};

/**
 * Convert GenerationEntry to GenerationResult for type compatibility.
 */
export function toGenerationResult(entry: GenerationEntry): GenerationResult {
  return {
    modelSelectionId: entry.modelSelectionId,
    modelKey: entry.modelKey,
    status: entry.status,
    code: entry.code,
    reasoning: entry.reasoning,
    gameId: entry.gameId,
    usage: entry.usage,
    error: entry.error,
  };
}

/**
 * Convert GenerationResult to GenerationEntry for store updates.
 */
export function fromGenerationResult(result: GenerationResult): GenerationEntry {
  return {
    modelSelectionId: result.modelSelectionId,
    modelKey: result.modelKey,
    status: result.status,
    code: result.code,
    reasoning: result.reasoning,
    gameId: result.gameId,
    usage: result.usage,
    error: result.error,
  };
}
