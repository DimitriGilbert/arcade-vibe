"use client";

import { useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { ModelSelection } from "@/lib/trpc-types";
import { useGenerationsStore } from "@/stores/generations-store";
import { MAX_MODELS } from "@/lib/model-types";

export interface UseModelSelectionProps {
  models: ModelSelection[];
  maxModels?: number;
}

export interface UseModelSelectionReturn {
  addModel: (selection: ModelSelection) => boolean;
  removeModel: (id: string) => boolean;
  totalCredits: number;
  canAddMore: boolean;
  isDuplicate: (modelKey: string) => boolean;
}

export function useModelSelection({
  models,
  maxModels = MAX_MODELS,
}: UseModelSelectionProps): UseModelSelectionReturn {
  const totalCredits = useMemo(
    () => models.reduce((sum, m) => sum + m.creditCost, 0),
    [models]
  );

  const canAddMore = models.length < maxModels;

  const isDuplicate = useCallback(
    (modelKey: string): boolean => {
      return models.some((m) => m.modelKey === modelKey);
    },
    [models]
  );

  const addModel = useCallback(
    (selection: ModelSelection): boolean => {
      if (models.length >= maxModels) {
        toast.error(`Maximum ${maxModels} models allowed`);
        return false;
      }
      if (isDuplicate(selection.modelKey)) {
        toast.error("Model already selected");
        return false;
      }
      return true;
    },
    [models.length, maxModels, isDuplicate]
  );

  const removeModel = useCallback((id: string): boolean => {
    const generation = useGenerationsStore.getState().generations[id];
    if (generation && (generation.status === "reasoning" || generation.status === "generating")) {
      toast.error("Cannot remove model while generating");
      return false;
    }
    return true;
  }, []);

  return {
    addModel,
    removeModel,
    totalCredits,
    canAddMore,
    isDuplicate,
  };
}
