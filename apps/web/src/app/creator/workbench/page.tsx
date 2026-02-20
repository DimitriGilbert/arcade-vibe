"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import {
  WorkbenchHeader,
  WorkbenchEditor,
  WorkbenchRightPanel,
  type ModelSelection,
  type ModelMetadata,
  type ApiKey,
  type RightPanelTab,
  MAX_MODELS,
  GENERATION_CONCURRENCY_LIMIT,
  WORKBENCH_STORAGE_KEY,
} from "@/components/creator/workbench";
import {
  useGenerationsStore,
  useGenerationGameId,
  useCompletedCount,
  type GenerationEntry,
} from "@/stores/generations-store";
import type { Visibility, PromptVersion } from "@/lib/trpc-types";

interface WorkbenchPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

interface PersistedState {
  promptContent: string;
  gameName: string;
  selectedTheme: string;
  selectedModels: ModelSelection[];
  timestamp: number;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(WORKBENCH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedState;
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(WORKBENCH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistState(state: Omit<PersistedState, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const toStore: PersistedState = { ...state, timestamp: Date.now() };
    localStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Storage might be full or disabled
  }
}

function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WORKBENCH_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

function toModelConfig(data: {
  id: string;
  providers: string[];
  modelName: string;
  tier: string;
  tierName: string;
  maxTokens: number;
  supportsImages: boolean;
}): ModelMetadata["models"][number] {
  return data;
}

export default function WorkbenchPage({ searchParams }: WorkbenchPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined })
  );
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [promptName, setPromptName] = useState("Untitled Prompt");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedModels, setSelectedModels] = useState<ModelSelection[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [isGenerating, setIsGenerating] = useState(false);
  const generationAbortedRef = useRef(false);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("models");
  const [activeOutputTab, setActiveOutputTab] = useState<string | null>(null);

  // Use Zustand store for generations
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
      setPromptName(persistedState.gameName || "Untitled Prompt");
      setSelectedTheme(persistedState.selectedTheme);
      setSelectedModels(persistedState.selectedModels);
    }
    setMounted(true);
  }, []);

  // Fetch themes
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: () => trpcClient.themes.list.query(),
  });

  // Auto-select first theme as default
  useEffect(() => {
    if (themes && themes.length > 0 && !selectedTheme) {
      const activeTheme = themes.find((t) => t.status === "active");
      setSelectedTheme(activeTheme?.id ?? themes[0]!.id);
    }
  }, [themes, selectedTheme]);

  // Fetch model metadata
  const { data: modelMetadata, isLoading: modelsLoading } = useQuery({
    queryKey: ["modelMetadata"],
    queryFn: async (): Promise<ModelMetadata | null> => {
      try {
        const result = await trpcClient.models.getModelMetadata.query();
        return {
          models: result.models.map(toModelConfig),
          tierCosts: result.tierCosts,
          tierCostsArray: result.tierCostsArray,
          providers: result.providers,
          tiers: result.tiers,
        };
      } catch {
        return null;
      }
    },
  });

  // Fetch existing prompt if editing or forking
  const { data: existingPrompt, isLoading: promptLoading } = useQuery({
    queryKey: ["prompt", resolvedSearchParams?.promptId || resolvedSearchParams?.forkId],
    queryFn: async () => {
      const id = resolvedSearchParams?.promptId || resolvedSearchParams?.forkId;
      if (!id) return null;
      return await trpcClient.prompts.getById.query({ id });
    },
    enabled: !!(resolvedSearchParams?.promptId || resolvedSearchParams?.forkId),
  });

  // Fetch prompt versions
  const { data: versions } = useQuery({
    queryKey: ["prompt-versions", existingPrompt?.id ?? selectedPromptId],
    queryFn: async () => {
      const promptId = existingPrompt?.id ?? selectedPromptId;
      if (!promptId) return [];
      return await trpcClient.prompts.listVersions.query({ promptId });
    },
    enabled: !!(existingPrompt?.id ?? selectedPromptId),
  });

  // Fetch user credits
  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  // Fetch user API keys for BYOK
  const { data: apiKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
  });

  // Initialize prompt content when existing prompt loads
  useEffect(() => {
    if (existingPrompt && !promptContent) {
      setPromptContent(existingPrompt.content);
      setSelectedTheme(existingPrompt.themeId);
      setSelectedPromptId(existingPrompt.id);
      setSelectedVersionId(existingPrompt.id);
      setPromptName(`Prompt v${existingPrompt.version}`);
      if (existingPrompt.visibility) {
        setVisibility(existingPrompt.visibility);
      }
    }
  }, [existingPrompt, promptContent]);

  // Persist editor state
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (resolvedSearchParams?.promptId || resolvedSearchParams?.forkId || existingPrompt) {
      return;
    }
    persistState({
      promptContent,
      gameName: promptName,
      selectedTheme,
      selectedModels,
    });
  }, [promptContent, promptName, selectedTheme, selectedModels, resolvedSearchParams, existingPrompt]);

  // Clear persisted state when loading from URL params
  useEffect(() => {
    if (existingPrompt) {
      clearPersistedState();
    }
  }, [existingPrompt]);

  // Auto-select first output tab when generations start
  useEffect(() => {
    const firstModel = selectedModels[0];
    if (firstModel && !activeOutputTab) {
      setActiveOutputTab(firstModel.id);
    }
  }, [selectedModels, activeOutputTab]);

  // Create prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (input: { themeId: string; content: string; visibility: Visibility }) => {
      const result = await trpcClient.prompts.create.mutate({
        themeId: input.themeId,
        content: input.content,
        tokenizer: "gpt-4",
        visibility: input.visibility,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt created!");
      void queryClient.invalidateQueries({ queryKey: ["prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      void queryClient.invalidateQueries({ queryKey: ["prompts-for-selector"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
        setSelectedVersionId(data.promptId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create prompt");
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (input: { id: string; content: string }) => {
      const result = await trpcClient.prompts.update.mutate({
        id: input.id,
        content: input.content,
        tokenizer: "gpt-4",
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt saved!");
      void queryClient.invalidateQueries({ queryKey: ["prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      void queryClient.invalidateQueries({ queryKey: ["prompts-for-selector"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
        setSelectedVersionId(data.promptId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save prompt");
    },
  });

  // Fork prompt mutation
  const forkPromptMutation = useMutation({
    mutationFn: async (input: { forkId: string }) => {
      const result = await trpcClient.prompts.fork.mutate({
        promptId: input.forkId,
        visibility: "private",
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt forked!");
      window.location.href = `/creator/workbench?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async (input: { id: string; visibility: Visibility }) => {
      const result = await trpcClient.prompts.updateVisibility.mutate({
        id: input.id,
        visibility: input.visibility,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Prompt is now ${data.visibility}`);
      void queryClient.invalidateQueries({ queryKey: ["prompt"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  // Handlers
  const handleAddModel = useCallback((selection: ModelSelection) => {
    if (selectedModels.length >= MAX_MODELS) {
      toast.error(`Maximum ${MAX_MODELS} models allowed`);
      return;
    }
    if (selectedModels.some((m) => m.modelKey === selection.modelKey)) {
      toast.error("Model already selected");
      return;
    }
    setSelectedModels((prev) => [...prev, selection]);
  }, [selectedModels]);

  const handleRemoveModel = useCallback((id: string) => {
    const generation = useGenerationsStore.getState().generations[id];
    if (generation && (generation.status === "reasoning" || generation.status === "generating")) {
      toast.error("Cannot remove model while generating");
      return;
    }
    setSelectedModels((prev) => prev.filter((m) => m.id !== id));
    removeGeneration(id);
    setActiveOutputTab((prev) => {
      if (prev === id) {
        const remaining = selectedModels.filter((m) => m.id !== id);
        return remaining.length > 0 ? remaining[0]!.id : null;
      }
      return prev;
    });
  }, [selectedModels, removeGeneration]);

  const handleGenerate = useCallback(async () => {
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

    setIsGenerating(true);
    setActiveRightTab("history");
    generationAbortedRef.current = false;

    const completionStats = { completed: 0, errors: 0, total: selectedModels.length };

    // Initialize all generations
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
      // Create new prompt first if not exists
      let promptId = selectedPromptId;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedTheme,
          content: promptContent,
          visibility,
        });
        promptId = result.promptId;
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
            name: promptName.trim() || undefined,
            reasoningEnabled: model.reasoningEnabled,
            reasoningMaxTokens: model.reasoningMaxTokens,
          });

          try {
            for await (const chunk of stream) {
              if (generationAbortedRef.current) return;

              if (chunk.type === "status" && "status" in chunk) {
                flushBufferedDeltas();
                updateGenerationStatus(model.id, chunk.status as "idle" | "reasoning" | "generating" | "complete" | "error");
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

      // Run with concurrency limit
      for (let index = 0; index < selectedModels.length; index += GENERATION_CONCURRENCY_LIMIT) {
        const batch = selectedModels.slice(index, index + GENERATION_CONCURRENCY_LIMIT);
        await Promise.all(batch.map((model) => runGenerationForModel(model)));
      }

      // Invalidate games list after generation completes
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });

      // Show aggregate toast
      if (completionStats.completed === completionStats.total) {
        toast.success(`All ${completionStats.total} games generated!`);
      } else if (completionStats.completed > 0) {
        toast.info(`${completionStats.completed}/${completionStats.total} games generated`);
      } else {
        toast.error("All generations failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate games");
    } finally {
      setIsGenerating(false);
    }
  }, [
    promptContent,
    selectedTheme,
    selectedModels,
    selectedPromptId,
    promptName,
    visibility,
    createPromptMutation,
    queryClient,
    setMultipleGenerations,
    updateGenerationStatus,
    updateGenerationCode,
    updateGenerationReasoning,
    updateGenerationGameId,
    updateGenerationError,
  ]);

  const handleSave = useCallback(async () => {
    if (!selectedTheme) {
      toast.error("Please select a theme");
      return;
    }
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    const promptId = selectedPromptId;
    if (promptId) {
      updatePromptMutation.mutate({ id: promptId, content: promptContent });
    } else {
      createPromptMutation.mutate({ themeId: selectedTheme, content: promptContent, visibility });
    }
  }, [selectedTheme, promptContent, selectedPromptId, visibility, updatePromptMutation, createPromptMutation]);

  const handleFork = useCallback(() => {
    if (!resolvedSearchParams?.forkId) return;
    forkPromptMutation.mutate({ forkId: resolvedSearchParams.forkId });
  }, [resolvedSearchParams?.forkId, forkPromptMutation]);

  const handleSelectVersion = useCallback(
    async (versionId: string) => {
      const versionData = versions?.find((v: PromptVersion) => v.id === versionId);
      if (versionData) {
        setPromptContent(versionData.content);
        setSelectedVersionId(versionId);
      }
    },
    [versions]
  );

  const handleNewVersion = useCallback(() => {
    setActiveRightTab("models");
  }, []);

  const handleVisibilityChange = useCallback((newVisibility: Visibility) => {
    setVisibility(newVisibility);
    if (selectedPromptId) {
      updateVisibilityMutation.mutate({ id: selectedPromptId, visibility: newVisibility });
    }
  }, [selectedPromptId, updateVisibilityMutation]);

  const handlePlayGame = useCallback(() => {
    if (activeGameId) {
      window.open(`/game/${activeGameId}`, "_blank");
    }
  }, [activeGameId]);

  // Handler for selecting an existing prompt from header dropdown
  const handleSelectPrompt = useCallback(async (promptId: string) => {
    try {
      const prompt = await trpcClient.prompts.getById.query({ id: promptId });
      if (prompt) {
        setPromptContent(prompt.content);
        setSelectedPromptId(prompt.id);
        setSelectedVersionId(prompt.id);
        setSelectedTheme(prompt.themeId);
        setPromptName(`Prompt v${prompt.version}`);
        if (prompt.visibility) {
          setVisibility(prompt.visibility);
        }
        // Clear generations when switching prompts
        clearGenerations();
        setActiveOutputTab(null);
        setSelectedModels([]);
      }
    } catch (error) {
      toast.error("Failed to load prompt");
      console.error(error);
    }
  }, [clearGenerations]);

  // Handler for creating a new prompt
  const handleNewPrompt = useCallback(() => {
    setPromptContent("");
    setSelectedPromptId(null);
    setSelectedVersionId(null);
    setPromptName("Untitled Prompt");
    setActiveRightTab("models");
    setSelectedModels([]);
    clearGenerations();
    setActiveOutputTab(null);
  }, [clearGenerations]);

  if (!mounted || promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const isForking = !!resolvedSearchParams?.forkId;
  const currentPrompt = existingPrompt ?? (selectedPromptId ? { id: selectedPromptId, version: 1 } : null);

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Header with actions */}
      <WorkbenchHeader
        promptName={promptName}
        onPromptNameChange={setPromptName}
        credits={credits}
        isLoading={modelsLoading}
        themes={themes}
        themesLoading={themesLoading}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
        selectedPromptId={selectedPromptId}
        onSelectPrompt={handleSelectPrompt}
        onNewPrompt={handleNewPrompt}
        versions={versions}
        currentVersion={currentPrompt?.version ?? null}
        selectedVersionId={selectedVersionId}
        onSelectVersion={handleSelectVersion}
        onNewVersion={handleNewVersion}
        selectedModels={selectedModels}
        promptContent={promptContent}
        isGenerating={isGenerating}
        isSaving={createPromptMutation.isPending || updatePromptMutation.isPending}
        completedCount={completedCount}
        activeGameId={activeGameId}
        onGenerate={handleGenerate}
        onSave={handleSave}
        onPlayGame={handlePlayGame}
      />

      {/* Fork Button (if forking) */}
      {isForking && (
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <button
            type="button"
            onClick={handleFork}
            disabled={forkPromptMutation.isPending}
            className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
          >
            <Copy className="h-4 w-4" />
            {forkPromptMutation.isPending ? "Forking..." : "Fork this prompt to edit"}
          </button>
        </div>
      )}

      {/* Main Content - Horizontal Split */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Panel - Editor (60%) */}
        <div className="w-[60%] min-w-0 p-3 border-r border-[var(--border)]">
          <WorkbenchEditor
            value={promptContent}
            onChange={setPromptContent}
            disabled={isGenerating}
          />
        </div>

        {/* Right Panel - Tabbed (40%) */}
        <div className="w-[40%] min-w-0 flex flex-col">
          <WorkbenchRightPanel
            activeTab={activeRightTab}
            onTabChange={setActiveRightTab}
            activeOutputTab={activeOutputTab}
            selectedModels={selectedModels}
            onOutputTabChange={setActiveOutputTab}
            promptId={selectedPromptId}
            modelMetadata={modelMetadata}
            onAddModel={handleAddModel}
            onRemoveModel={handleRemoveModel}
            apiKeys={apiKeys as ApiKey[] | undefined}
            disabled={isGenerating}
            visibility={visibility}
            onVisibilityChange={handleVisibilityChange}
          />
        </div>
      </div>
    </div>
  );
}
