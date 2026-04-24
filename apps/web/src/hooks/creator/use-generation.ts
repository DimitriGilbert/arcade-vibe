import { useCallback, useRef, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection, GenerationStatus, Visibility } from "@/lib/trpc-types";
import type { GenerationEntry } from "@/stores/generations-store";
import {
  useGenerationsStore,
} from "@/stores/generations-store";
import { DEFAULT_GENERATION_CONCURRENCY_LIMIT } from "@/lib/generation-limits";
import { useDiscoveryDialog } from "@/components/creator/shared";

export interface UseGenerationOptions {
  promptContent: string;
  promptTitle?: string;
  gameName?: string;
  selectedTheme: string | null;
  selectedModels: ModelSelection[];
  existingPromptId?: string | null;
  visibility?: Visibility;
  onPromptCreated?: (promptId: string) => void;
  onGenerationStart?: (context: {
    promptId: string;
    generationSessionId: string;
    models: ModelSelection[];
  }) => void;
  onGenerationComplete?: (gameId: string, modelId: string) => void;
  setActiveOutputTab?: (id: string | null) => void;
  generationConcurrencyLimit?: number;
}

export interface UseGenerationReturn {
  isGenerating: boolean;
  handleGenerate: () => Promise<void>;
  abortGeneration: () => void;
  completedCount: number;
  discoveryDialog: ReturnType<typeof useDiscoveryDialog>;
}

export function useGeneration(options: UseGenerationOptions): UseGenerationReturn {
  const {
    promptContent,
    promptTitle = "",
    gameName = "",
    selectedTheme,
    selectedModels,
    existingPromptId,
    visibility = "private",
    onPromptCreated,
    onGenerationStart,
    onGenerationComplete,
    setActiveOutputTab,
    generationConcurrencyLimit = DEFAULT_GENERATION_CONCURRENCY_LIMIT,
  } = options;

  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const generationAbortedRef = useRef(false);
  const generationInFlightRef = useRef(false);

  const updateGenerationStatus = useGenerationsStore((state) => state.updateGenerationStatus);
  const updateGenerationCode = useGenerationsStore((state) => state.updateGenerationCode);
  const updateGenerationReasoning = useGenerationsStore((state) => state.updateGenerationReasoning);
  const updateGenerationGameId = useGenerationsStore((state) => state.updateGenerationGameId);
  const updateGenerationError = useGenerationsStore((state) => state.updateGenerationError);
  const setMultipleGenerations = useGenerationsStore((state) => state.setMultipleGenerations);

  const discoveryDialog = useDiscoveryDialog();

  const createPromptMutation = useMutation({
    mutationFn: async (input: { themeId: string; content: string; title?: string }) => {
      return await trpcClient.prompts.create.mutate({
        themeId: input.themeId,
        content: input.content,
        title: input.title,
        tokenizer: "gpt-4",
        visibility,
      });
    },
    onSuccess: (data) => {
      if (data.promptId) {
        onPromptCreated?.(data.promptId);
        void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      }
    },
  });

  const abortGeneration = useCallback(() => {
    generationAbortedRef.current = true;
  }, []);

  const createGenerationSessionId = useCallback(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `generation-${Date.now()}`;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (generationInFlightRef.current) {
      return;
    }

    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    if (!selectedTheme) {
      toast.error("Please select a theme");
      return;
    }
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    generationInFlightRef.current = true;
    setIsGenerating(true);
    generationAbortedRef.current = false;

    const completionStats = { completed: 0, errors: 0, total: selectedModels.length };

    try {
      let promptId = existingPromptId ?? null;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedTheme,
          content: promptContent,
          title: promptTitle.trim() || undefined,
        });
        promptId = result.promptId ?? null;
      }

      if (!promptId) {
        toast.error("Failed to create prompt");
        return;
      }

      const generationSessionId = createGenerationSessionId();
      const initialGenerations: Record<string, GenerationEntry> = {};
      for (const model of selectedModels) {
        initialGenerations[model.id] = {
          modelSelectionId: model.id,
          modelKey: model.modelKey,
          modelName: model.modelName,
          status: "idle",
          code: "",
          gameId: null,
          promptId,
          themeId: selectedTheme,
          generationSessionId,
          promptTitle: promptTitle.trim(),
          gameName: gameName.trim(),
        };
      }
      setMultipleGenerations(initialGenerations);
      onGenerationStart?.({
        promptId,
        generationSessionId,
        models: selectedModels,
      });

      discoveryDialog.open();

      const runGenerationForModel = async (model: ModelSelection): Promise<void> => {
        if (generationAbortedRef.current || !promptId) return;

        updateGenerationStatus(model.id, "reasoning");

        try {
          let bufferedCodeDelta = "";
          let bufferedReasoningDelta = "";

          const flushBufferedDeltas = () => {
            if (bufferedReasoningDelta.length > 0) {
              updateGenerationReasoning(model.id, bufferedReasoningDelta);
              bufferedReasoningDelta = "";
            }
            if (bufferedCodeDelta.length > 0) {
              updateGenerationCode(model.id, bufferedCodeDelta);
              bufferedCodeDelta = "";
            }
          };

          const flushIntervalId = setInterval(flushBufferedDeltas, 33);

          const stream = await trpcClient.generate.streamGeneration.mutate({
            promptId,
            modelKey: model.modelKey,
            apiKeyId: model.apiKeyId ?? undefined,
            name: gameName.trim() || undefined,
            reasoningEnabled: model.reasoningEnabled,
            reasoningMaxTokens: model.reasoningMaxTokens,
          });

          try {
            for await (const chunk of stream) {
              if (generationAbortedRef.current) return;

              if (chunk.type === "status" && "status" in chunk) {
                flushBufferedDeltas();
                updateGenerationStatus(model.id, chunk.status as GenerationStatus);
              } else if (chunk.type === "reasoning-chunk" && "delta" in chunk) {
                bufferedReasoningDelta += chunk.delta as string;
              } else if (chunk.type === "chunk" && "delta" in chunk) {
                bufferedCodeDelta += chunk.delta as string;
              } else if (chunk.type === "complete" && "gameId" in chunk) {
                flushBufferedDeltas();
                completionStats.completed++;
                const gameId = chunk.gameId as string;
                updateGenerationGameId(model.id, gameId);
                onGenerationComplete?.(gameId, model.id);
                if (setActiveOutputTab) {
                  setActiveOutputTab(gameId);
                }
              } else if (chunk.type === "error") {
                flushBufferedDeltas();
                completionStats.errors++;
                const errorMsg = "error" in chunk ? String(chunk.error) : "Generation failed";
                toast.error(`${model.modelName}: ${errorMsg}`);
                updateGenerationError(model.id, errorMsg);
              }
            }
          } finally {
            clearInterval(flushIntervalId);
            flushBufferedDeltas();
          }
        } catch (error) {
          if (generationAbortedRef.current) return;
          const errorMsg = error instanceof Error ? error.message : "Generation failed";
          completionStats.errors++;
          toast.error(`${model.modelName}: ${errorMsg}`);
          updateGenerationError(model.id, errorMsg);
        }
      };

      for (let index = 0; index < selectedModels.length; index += generationConcurrencyLimit) {
        const batch = selectedModels.slice(index, index + generationConcurrencyLimit);
        await Promise.all(batch.map((model) => runGenerationForModel(model)));
      }

      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
      if (promptId) {
        void queryClient.invalidateQueries({ queryKey: ["prompt-versions", promptId] });
      }

      if (completionStats.completed === completionStats.total) {
        toast.success(`All ${completionStats.total} games generated!`);
      } else if (completionStats.completed > 0) {
        toast.info(`${completionStats.completed}/${completionStats.total} games generated (${completionStats.errors} failed)`);
      } else {
        toast.error("All generations failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate games");
    } finally {
      generationInFlightRef.current = false;
      setIsGenerating(false);
    }
  }, [
    promptContent,
    promptTitle,
    gameName,
    selectedTheme,
    selectedModels,
    existingPromptId,
    createPromptMutation,
    setMultipleGenerations,
    updateGenerationStatus,
    updateGenerationCode,
    updateGenerationReasoning,
    updateGenerationGameId,
    updateGenerationError,
    queryClient,
    discoveryDialog,
    onPromptCreated,
    onGenerationStart,
    onGenerationComplete,
    setActiveOutputTab,
    createGenerationSessionId,
  ]);

  return {
    isGenerating,
    handleGenerate,
    abortGeneration,
    completedCount: useGenerationsStore((state) => 
      Object.values(state.generations).filter((g) => g.status === "complete" || g.status === "error").length
    ),
    discoveryDialog,
  };
}
