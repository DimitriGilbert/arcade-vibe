import { useState, useEffect, useCallback, useRef, useMemo, type Dispatch, type SetStateAction } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection, GenerationStatus } from "@/components/editor/model-types";
import {
  useGenerationsStore,
  useGenerationById,
  useGenerationGameId,
  useCompletedCount,
  type GenerationEntry,
} from "@/stores/generations-store";
import type {
  FilebrowserSelection,
  PersistedFilebrowserState,
  ThemeNode,
  PromptNode,
  RunNode,
  STORAGE_KEY,
  STORAGE_EXPIRY_MS,
  MAX_MODELS,
  GENERATION_CONCURRENCY_LIMIT,
} from "./types";

const storageKey: typeof STORAGE_KEY = "arcade-vibe-creator-filebrowser";
const storageExpiryMs: typeof STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000;
const maxModels: typeof MAX_MODELS = 4;
const generationConcurrencyLimit: typeof GENERATION_CONCURRENCY_LIMIT = 2;

function loadPersistedState(): PersistedFilebrowserState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedFilebrowserState;
    if (Date.now() - parsed.timestamp > storageExpiryMs) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistState(state: Omit<PersistedFilebrowserState, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const toStore: PersistedFilebrowserState = { ...state, timestamp: Date.now() };
    localStorage.setItem(storageKey, JSON.stringify(toStore));
  } catch {
    // Storage might be full or disabled
  }
}

function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore errors
  }
}

export interface UseFilebrowserStateReturn {
  // State
  mounted: boolean;
  promptContent: string;
  setPromptContent: (content: string) => void;
  gameName: string;
  setGameName: (name: string) => void;
  selectedModels: ModelSelection[];
  setSelectedModels: (models: ModelSelection[]) => void;
  isGenerating: boolean;
  selection: FilebrowserSelection;
  setSelection: Dispatch<SetStateAction<FilebrowserSelection>>;
  expandedThemes: string[];
  setExpandedThemes: (ids: string[]) => void;
  expandedPrompts: string[];
  activeOutputTab: string | null;
  setActiveOutputTab: (id: string | null) => void;

  // Queries
  themes: ThemeNode[] | undefined;
  themesLoading: boolean;
  prompts: PromptNode[] | undefined;
  promptsLoading: boolean;
  runs: RunNode[] | undefined;
  runsLoading: boolean;
  runsByPromptId: Record<string, RunNode[]>;
  runsLoadingByPromptId: Record<string, boolean>;
  credits: { balance: number } | undefined;
  versions: Array<{ id: string; version: number; createdAt: string; content: string }> | undefined;

  // Actions
  handleAddModel: (model: ModelSelection) => void;
  handleRemoveModel: (id: string) => void;
  handleGenerate: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleNewPrompt: () => void;
  handleSelectPrompt: (promptId: string) => Promise<void>;
  handleSelectVersion: (versionId: string) => Promise<void>;
  handleDeletePrompt: (promptId: string) => void;
  handleTogglePromptVisibility: (promptId: string, visibility: "private" | "public" | "public_on_freeze") => void;
  handleToggleThemeExpand: (themeId: string) => void;
  handleTogglePromptExpand: (promptId: string) => void;
  
  // Store actions
  clearGenerations: () => void;

  // Derived
  currentPromptId: string | null;
  deletingPromptId: string | null;
  activeGameId: string | null;
  completedCount: number;
}

export function useFilebrowserState(): UseFilebrowserStateReturn {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [gameName, setGameName] = useState("");
  const [selectedModels, setSelectedModels] = useState<ModelSelection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationAbortedRef = useRef(false);
  const [selection, setSelection] = useState<FilebrowserSelection>({
    type: null,
    themeId: null,
    promptId: null,
    runId: null,
  });
  const [expandedThemes, setExpandedThemes] = useState<string[]>([]);
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);
  const [activeOutputTab, setActiveOutputTab] = useState<string | null>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // Store actions
  const updateGenerationStatus = useGenerationsStore((state) => state.updateGenerationStatus);
  const updateGenerationCode = useGenerationsStore((state) => state.updateGenerationCode);
  const updateGenerationReasoning = useGenerationsStore((state) => state.updateGenerationReasoning);
  const updateGenerationGameId = useGenerationsStore((state) => state.updateGenerationGameId);
  const updateGenerationError = useGenerationsStore((state) => state.updateGenerationError);
  const removeGeneration = useGenerationsStore((state) => state.removeGeneration);
  const clearGenerations = useGenerationsStore((state) => state.clearGenerations);
  const setMultipleGenerations = useGenerationsStore((state) => state.setMultipleGenerations);
  const activeGameId = useGenerationGameId(activeOutputTab);
  const completedCount = useCompletedCount();

  // Load persisted state on mount
  useEffect(() => {
    const persistedState = loadPersistedState();
    if (persistedState) {
      setPromptContent(persistedState.promptContent);
      setGameName(persistedState.gameName);
      if (persistedState.selectedTheme) {
        setExpandedThemes([persistedState.selectedTheme]);
      }
      setSelectedModels(persistedState.selectedModels);
      if (persistedState.selection) {
        setSelection(persistedState.selection);
      }
    }
    setMounted(true);
  }, []);

  // Fetch themes
  const { data: themesData, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: () => trpcClient.themes.list.query(),
  });

  const themes = themesData?.map((t): ThemeNode => ({
    id: t.id,
    title: t.title,
    status: t.status,
    isActive: t.status === "active",
  }));

  // Auto-expand first active theme
  useEffect(() => {
    if (themes && expandedThemes.length === 0) {
      const firstActive = themes.find((t) => t.isActive);
      if (firstActive) {
        setExpandedThemes([firstActive.id]);
        setSelection((prev) => ({ ...prev, type: "theme", themeId: firstActive.id }));
      }
    }
  }, [themes, expandedThemes.length]);

  // Fetch prompts for selected theme
  const { data: promptsData, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts-by-theme", selection.themeId],
    queryFn: async () => {
      if (!selection.themeId) return [];
      return await trpcClient.prompts.listMineByTheme.query({
        themeId: selection.themeId,
      });
    },
    enabled: !!selection.themeId,
  });

  const prompts = promptsData?.map((p): PromptNode => ({
    id: p.id,
    content: p.content,
    version: p.version,
    visibility: p.visibility ?? "private",
    updatedAt: p.updatedAt,
    themeId: selection.themeId ?? "",
  }));

  // Fetch runs for selected prompt (for backward compatibility in center panel)
  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ["games-by-prompt", selection.promptId],
    queryFn: async () => {
      if (!selection.promptId) return [];
      const result = await trpcClient.games.listByPrompt.query({ promptId: selection.promptId });
      return result ?? [];
    },
    enabled: !!selection.promptId,
  });

  const runs = runsData?.map((g): RunNode => ({
    id: g.id,
    name: g.name,
    modelName: g.modelName,
    status: g.status as GenerationStatus,
    createdAt: g.createdAt,
    gameId: g.id,
    isSubmitted: g.isSubmitted,
    promptId: g.promptId ?? "",
  }));

  // Fetch runs for all expanded prompts (for file tree)
  const expandedPromptRunsQueries = useQueries({
    queries: expandedPrompts.map((promptId) => ({
      queryKey: ["games-by-prompt", promptId],
      queryFn: async () => {
        const result = await trpcClient.games.listByPrompt.query({ promptId });
        return result ?? [];
      },
      enabled: !!promptId,
    })),
  });

  // Build maps for runs by prompt ID
  const { runsByPromptId, runsLoadingByPromptId } = useMemo(() => {
    const byId: Record<string, RunNode[]> = {};
    const loadingById: Record<string, boolean> = {};

    expandedPrompts.forEach((promptId, index) => {
      const queryResult = expandedPromptRunsQueries[index];
      loadingById[promptId] = queryResult?.isLoading ?? false;
      
      if (queryResult?.data) {
        byId[promptId] = queryResult.data.map((g): RunNode => ({
          id: g.id,
          name: g.name,
          modelName: g.modelName,
          status: g.status as GenerationStatus,
          createdAt: g.createdAt,
          gameId: g.id,
          isSubmitted: g.isSubmitted,
          promptId: g.promptId ?? "",
        }));
      } else {
        byId[promptId] = [];
      }
    });

    return { runsByPromptId: byId, runsLoadingByPromptId: loadingById };
  }, [expandedPrompts, expandedPromptRunsQueries]);

  // Fetch credits
  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  // Fetch versions for selected prompt
  const { data: versions } = useQuery({
    queryKey: ["prompt-versions", selectedPromptId],
    queryFn: async () => {
      if (!selectedPromptId) return [];
      return await trpcClient.prompts.listVersions.query({ promptId: selectedPromptId });
    },
    enabled: !!selectedPromptId,
  });

  // Persist state
  useEffect(() => {
    if (!mounted || selectedPromptId) return;
    persistState({
      promptContent,
      gameName,
      selectedTheme: selection.themeId ?? "",
      selectedModels,
      selection,
      expandedThemes,
    });
  }, [mounted, promptContent, gameName, selection, selectedModels, expandedThemes, selectedPromptId]);

  // Clear persisted state when loading from URL
  useEffect(() => {
    if (selectedPromptId) {
      clearPersistedState();
    }
  }, [selectedPromptId]);

  // Auto-select first output tab when models change
  useEffect(() => {
    const firstModel = selectedModels[0];
    if (firstModel && !activeOutputTab) {
      setActiveOutputTab(firstModel.id);
    }
  }, [selectedModels, activeOutputTab]);

  // Create prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (input: { themeId: string; content: string }) => {
      return await trpcClient.prompts.create.mutate({
        themeId: input.themeId,
        content: input.content,
        tokenizer: "gpt-4",
        visibility: "private",
      });
    },
    onSuccess: (data) => {
      toast.success("Prompt created successfully!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
        setSelection((prev) => ({ ...prev, type: "prompt", promptId: data.promptId }));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create prompt");
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (input: { id: string; content: string }) => {
      return await trpcClient.prompts.update.mutate({
        id: input.id,
        content: input.content,
        tokenizer: "gpt-4",
      });
    },
    onSuccess: (data) => {
      toast.success("Prompt updated successfully!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      void queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update prompt");
    },
  });

  // Soft delete prompt mutation
  const softDeletePromptMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      setDeletingPromptId(input.id);
      return await trpcClient.prompts.softDelete.mutate({ id: input.id });
    },
    onSuccess: (data) => {
      toast.success("Prompt deleted!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      if (selectedPromptId === data.promptId) {
        setSelectedPromptId(null);
        setPromptContent("");
        setSelection((prev) => ({ ...prev, type: "theme", promptId: null }));
      }
      setDeletingPromptId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete prompt");
      setDeletingPromptId(null);
    },
  });

  // Update prompt visibility mutation
  const updatePromptVisibilityMutation = useMutation({
    mutationFn: async (input: { id: string; visibility: "private" | "public" | "public_on_freeze" }) => {
      return await trpcClient.prompts.updateVisibility.mutate({
        id: input.id,
        visibility: input.visibility,
      });
    },
    onSuccess: (data) => {
      toast.success(`Prompt is now ${data.visibility}`);
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  // Model selection handlers
  const handleAddModel = useCallback((model: ModelSelection) => {
    if (selectedModels.length >= maxModels) {
      toast.error(`Maximum ${maxModels} models allowed`);
      return;
    }
    if (selectedModels.some((m) => m.modelKey === model.modelKey)) {
      toast.error("Model already selected");
      return;
    }
    setSelectedModels((prev) => [...prev, model]);
  }, [selectedModels]);

  const handleRemoveModel = useCallback((id: string) => {
    const generation = useGenerationsStore.getState().generations[id];
    if (generation && (generation.status === "reasoning" || generation.status === "generating")) {
      toast.error("Cannot remove model while generating");
      return;
    }
    setSelectedModels((prev) => {
      const remaining = prev.filter((m) => m.id !== id);

      setActiveOutputTab((currentTab) => {
        if (currentTab === id) {
          return remaining.length > 0 ? remaining[0]!.id : null;
        }
        return currentTab;
      });

      return remaining;
    });
    removeGeneration(id);
  }, [removeGeneration]);

  // Generate handler
  const handleGenerate = useCallback(async () => {
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    if (!selection.themeId) {
      toast.error("Please select a theme");
      return;
    }
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    setIsGenerating(true);
    generationAbortedRef.current = false;

    const completionStats = { completed: 0, errors: 0, total: selectedModels.length };

    const initialGenerations: Record<string, GenerationEntry> = {};
    for (const model of selectedModels) {
      initialGenerations[model.id] = {
        modelSelectionId: model.id,
        modelKey: model.modelKey,
        status: "idle",
        code: "",
        gameId: null,
      };
    }
    setMultipleGenerations(initialGenerations);

    try {
      let promptId = selectedPromptId;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selection.themeId,
          content: promptContent,
        });
        promptId = result.promptId ?? null;
        setSelectedPromptId(promptId);
      }

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
                updateGenerationGameId(model.id, chunk.gameId as string);
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

      // Refresh runs list
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      // Refresh credits balance after generation
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
      // Refresh prompt versions after generation
      if (promptId) {
        void queryClient.invalidateQueries({ queryKey: ["prompt-versions", promptId] });
      }

      if (completionStats.completed === completionStats.total) {
        toast.success(`All ${completionStats.total} games generated successfully!`);
      } else if (completionStats.completed > 0) {
        toast.info(`${completionStats.completed}/${completionStats.total} games generated (${completionStats.errors} failed)`);
      } else {
        toast.error("All generations failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate games");
    } finally {
      setIsGenerating(false);
    }
  }, [
    promptContent,
    gameName,
    selection.themeId,
    selectedModels,
    selectedPromptId,
    createPromptMutation,
    setMultipleGenerations,
    updateGenerationStatus,
    updateGenerationCode,
    updateGenerationReasoning,
    updateGenerationGameId,
    updateGenerationError,
    queryClient,
  ]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!selection.themeId) {
      toast.error("Please select a theme");
      return;
    }
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    if (selectedPromptId) {
      await updatePromptMutation.mutateAsync({
        id: selectedPromptId,
        content: promptContent,
      });
    } else {
      await createPromptMutation.mutateAsync({
        themeId: selection.themeId,
        content: promptContent,
      });
    }
  }, [selection.themeId, promptContent, selectedPromptId, updatePromptMutation, createPromptMutation]);

  // New prompt handler
  const handleNewPrompt = useCallback(() => {
    setPromptContent("");
    setSelectedPromptId(null);
    setSelection((prev) => ({ ...prev, type: "theme", promptId: null, runId: null }));
    setSelectedModels([]);
    clearGenerations();
    setActiveOutputTab(null);
  }, [clearGenerations]);

  // Select prompt handler
  const handleSelectPrompt = useCallback(async (promptId: string) => {
    try {
      const prompt = await trpcClient.prompts.getById.query({ id: promptId });
      if (prompt) {
        setPromptContent(prompt.content);
        setSelectedPromptId(prompt.id);
        setSelection((prev) => ({
          ...prev,
          type: "prompt",
          promptId: prompt.id,
          runId: null,
        }));
        setExpandedThemes((prev) => {
          if (!prev.includes(prompt.themeId)) {
            return [...prev, prompt.themeId];
          }
          return prev;
        });
        setExpandedPrompts((prev) => {
          if (!prev.includes(prompt.id)) {
            return [...prev, prompt.id];
          }
          return prev;
        });
        // Clear generation state when switching prompts
        setSelectedModels([]);
        clearGenerations();
        setActiveOutputTab(null);
      }
    } catch {
      toast.error("Failed to load prompt");
    }
  }, [clearGenerations]);

  // Select version handler
  const handleSelectVersion = useCallback(async (versionId: string) => {
    if (!versions) return;
    const versionData = versions.find((v) => v.id === versionId);
    if (versionData) {
      setPromptContent(versionData.content);
    }
  }, [versions]);

  // Delete prompt handler
  const handleDeletePrompt = useCallback((promptId: string) => {
    softDeletePromptMutation.mutate({ id: promptId });
  }, [softDeletePromptMutation]);

  // Toggle visibility handler
  const handleTogglePromptVisibility = useCallback((promptId: string, visibility: "private" | "public" | "public_on_freeze") => {
    updatePromptVisibilityMutation.mutate({ id: promptId, visibility });
  }, [updatePromptVisibilityMutation]);

  // Toggle theme expand handler
  const handleToggleThemeExpand = useCallback((themeId: string) => {
    setExpandedThemes((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId);
      }
      return [...prev, themeId];
    });
  }, []);

  // Toggle prompt expand handler
  const handleTogglePromptExpand = useCallback((promptId: string) => {
    setExpandedPrompts((prev) => {
      if (prev.includes(promptId)) {
        return prev.filter((id) => id !== promptId);
      }
      return [...prev, promptId];
    });
  }, []);

  return {
    // State
    mounted,
    promptContent,
    setPromptContent,
    gameName,
    setGameName,
    selectedModels,
    setSelectedModels,
    isGenerating,
    selection,
    setSelection,
    expandedThemes,
    setExpandedThemes,
    expandedPrompts,
    activeOutputTab,
    setActiveOutputTab,

    // Queries
    themes,
    themesLoading,
    prompts,
    promptsLoading,
    runs,
    runsLoading,
    runsByPromptId,
    runsLoadingByPromptId,
    credits,
    versions,

    // Actions
    handleAddModel,
    handleRemoveModel,
    handleGenerate,
    handleSave,
    handleNewPrompt,
    handleSelectPrompt,
    handleSelectVersion,
    handleDeletePrompt,
    handleTogglePromptVisibility,
    handleToggleThemeExpand,
    handleTogglePromptExpand,

    // Store actions
    clearGenerations,

    // Derived
    currentPromptId: selectedPromptId,
    deletingPromptId,
    activeGameId,
    completedCount,
  };
}
