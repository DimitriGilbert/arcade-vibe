"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import {
  CodelabSidebar,
  CodelabModelPicker,
  CodelabPromptCell,
  CodelabOutputCell,
  CodelabRunHistory,
  type CodelabModelSelection,
  type CodelabModelMetadata,
  type CodelabApiKey,
  type CodelabRunCell,
  type CodelabOutput,
  type CodelabVersion,
} from "@/components/creator/codelab";
import type { GenerationStatus } from "@/components/editor/model-types";
import type { Visibility } from "@/lib/trpc-types";

const STORAGE_KEY = "arcade-vibe-creator-codelab";
const GENERATION_CONCURRENCY_LIMIT = 2;

interface PersistedState {
  promptContent: string;
  gameName: string;
  selectedThemeId: string;
  selectedModels: CodelabModelSelection[];
  runHistory: CodelabRunCell[];
  timestamp: number;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedState;
    // 24 hour expiry
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Storage might be full or disabled
  }
}

interface CodelabPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

export default function CodelabPage({ searchParams }: CodelabPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined })
  );
  const queryClient = useQueryClient();

  // Core state
  const [mounted, setMounted] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [gameName, setGameName] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [selectedModels, setSelectedModels] = useState<CodelabModelSelection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationAbortedRef = useRef(false);

  // Prompt/version state
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<string | null>(null);

  // Current run outputs
  const [currentOutputs, setCurrentOutputs] = useState<Record<string, CodelabOutput>>({});

  // Run history
  const [runHistory, setRunHistory] = useState<CodelabRunCell[]>([]);

  // Completed count for progress display
  const [completedCount, setCompletedCount] = useState(0);

  // Load persisted state on mount
  useEffect(() => {
    const persistedState = loadPersistedState();
    if (persistedState) {
      setPromptContent(persistedState.promptContent);
      setGameName(persistedState.gameName);
      setSelectedThemeId(persistedState.selectedThemeId);
      setSelectedModels(persistedState.selectedModels);
      setRunHistory(persistedState.runHistory);
    }
    setMounted(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!mounted) return;
    if (resolvedSearchParams?.promptId || resolvedSearchParams?.forkId) return;
    persistState({
      promptContent,
      gameName,
      selectedThemeId,
      selectedModels,
      runHistory,
    });
  }, [
    promptContent,
    gameName,
    selectedThemeId,
    selectedModels,
    runHistory,
    mounted,
    resolvedSearchParams?.promptId,
    resolvedSearchParams?.forkId,
  ]);

  // Fetch themes
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["codelab-themes"],
    queryFn: () => trpcClient.themes.list.query(),
  });

  // Auto-select first theme
  useEffect(() => {
    if (themes && themes.length > 0 && !selectedThemeId) {
      setSelectedThemeId(themes[0]!.id);
    }
  }, [themes, selectedThemeId]);

  // Fetch model metadata
  const { data: modelMetadataRaw, isLoading: modelsLoading } = useQuery({
    queryKey: ["codelab-model-metadata"],
    queryFn: () => trpcClient.models.getModelMetadata.query(),
  });

  // Transform model metadata
  const modelMetadata: CodelabModelMetadata | null = modelMetadataRaw
    ? {
        models: modelMetadataRaw.models,
        tierCosts: modelMetadataRaw.tierCosts,
        tierCostsArray: modelMetadataRaw.tierCostsArray,
        providers: modelMetadataRaw.providers,
        tiers: modelMetadataRaw.tiers,
      }
    : null;

  // Fetch user prompts
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["codelab-prompts", selectedThemeId],
    queryFn: () => {
      if (selectedThemeId) {
        return trpcClient.prompts.listMineByTheme.query({ themeId: selectedThemeId });
      }
      return trpcClient.prompts.listMine.query();
    },
  });

  // Fetch credits
  const { data: credits } = useQuery({
    queryKey: ["codelab-credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  // Fetch API keys
  const { data: apiKeys } = useQuery({
    queryKey: ["codelab-api-keys"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
  });

  // Fetch existing prompt if editing
  const { data: existingPrompt, isLoading: promptLoading } = useQuery({
    queryKey: [
      "codelab-prompt",
      resolvedSearchParams?.promptId || resolvedSearchParams?.forkId,
    ],
    queryFn: async () => {
      const id = resolvedSearchParams?.promptId || resolvedSearchParams?.forkId;
      if (!id) return null;
      return await trpcClient.prompts.getById.query({ id });
    },
    enabled: !!(resolvedSearchParams?.promptId || resolvedSearchParams?.forkId),
  });

  // Fetch versions
  const { data: versions } = useQuery({
    queryKey: ["codelab-versions", existingPrompt?.id ?? selectedPromptId],
    queryFn: async () => {
      const promptId = existingPrompt?.id ?? selectedPromptId;
      if (!promptId) return [];
      return await trpcClient.prompts.listVersions.query({ promptId });
    },
    enabled: !!(existingPrompt?.id ?? selectedPromptId),
  });

  // Initialize from existing prompt
  useEffect(() => {
    if (existingPrompt && !promptContent) {
      setPromptContent(existingPrompt.content);
      setSelectedThemeId(existingPrompt.themeId);
      setSelectedPromptId(existingPrompt.id);
    }
  }, [existingPrompt, promptContent]);

  // Auto-select first output tab
  useEffect(() => {
    const outputIds = Object.keys(currentOutputs);
    if (outputIds.length > 0 && !activeOutputTab) {
      setActiveOutputTab(outputIds[0]!);
    }
  }, [currentOutputs, activeOutputTab]);

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
      toast.success("Prompt created!");
      void queryClient.invalidateQueries({ queryKey: ["codelab-prompts"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
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
    onSuccess: () => {
      toast.success("Prompt saved!");
      void queryClient.invalidateQueries({ queryKey: ["codelab-prompts"] });
      void queryClient.invalidateQueries({ queryKey: ["codelab-versions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save prompt");
    },
  });

  // Fork prompt mutation
  const forkPromptMutation = useMutation({
    mutationFn: async (forkId: string) => {
      return await trpcClient.prompts.fork.mutate({
        promptId: forkId,
        visibility: "private",
      });
    },
    onSuccess: (data) => {
      toast.success("Prompt forked!");
      void queryClient.invalidateQueries({ queryKey: ["codelab-prompts"] });
      window.location.href = `/creator/codelab?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  // Delete prompt mutation
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingPromptId(id);
      return await trpcClient.prompts.softDelete.mutate({ id });
    },
    onSuccess: (data) => {
      toast.success("Prompt deleted!");
      void queryClient.invalidateQueries({ queryKey: ["codelab-prompts"] });
      if (selectedPromptId === data.promptId) {
        setSelectedPromptId(null);
        setPromptContent("");
      }
      setDeletingPromptId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete prompt");
      setDeletingPromptId(null);
    },
  });

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async (input: { id: string; visibility: Visibility }) => {
      return await trpcClient.prompts.updateVisibility.mutate(input);
    },
    onSuccess: (data) => {
      toast.success(`Prompt is now ${data.visibility}`);
      void queryClient.invalidateQueries({ queryKey: ["codelab-prompts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  // Handlers
  const handleAddModel = useCallback((selection: CodelabModelSelection) => {
    setSelectedModels((prev) => [...prev, selection]);
  }, []);

  const handleRemoveModel = useCallback((id: string) => {
    setSelectedModels((prev) => prev.filter((m) => m.id !== id));
    setCurrentOutputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setActiveOutputTab((prev) => {
      if (prev === id) {
        const remaining = selectedModels.filter((m) => m.id !== id);
        return remaining.length > 0 ? remaining[0]!.id : null;
      }
      return prev;
    });
  }, [selectedModels]);

  const handleSelectPrompt = useCallback(async (promptId: string) => {
    try {
      const prompt = await trpcClient.prompts.getById.query({ id: promptId });
      if (prompt) {
        setPromptContent(prompt.content);
        setSelectedPromptId(prompt.id);
        setSelectedThemeId(prompt.themeId);
      }
    } catch (error) {
      toast.error("Failed to load prompt");
      console.error(error);
    }
  }, []);

  const handleNewPrompt = useCallback(() => {
    setPromptContent("");
    setSelectedPromptId(null);
    setSelectedModels([]);
    setCurrentOutputs({});
    setActiveOutputTab(null);
    setCompletedCount(0);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedThemeId) {
      toast.error("Please select a theme");
      return;
    }
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    const promptId = existingPrompt?.id ?? selectedPromptId;
    if (promptId) {
      updatePromptMutation.mutate({ id: promptId, content: promptContent });
    } else {
      createPromptMutation.mutate({ themeId: selectedThemeId, content: promptContent });
    }
  }, [
    selectedThemeId,
    promptContent,
    existingPrompt,
    selectedPromptId,
    updatePromptMutation,
    createPromptMutation,
  ]);

  const handleLoadVersion = useCallback(
    async (versionId: string) => {
      if (!versions) return;
      const version = versions.find((v) => v.id === versionId);
      if (version) {
        setPromptContent(version.content);
      }
    },
    [versions]
  );

  const handleFork = useCallback(() => {
    if (!resolvedSearchParams?.forkId) return;
    forkPromptMutation.mutate(resolvedSearchParams.forkId);
  }, [resolvedSearchParams?.forkId, forkPromptMutation]);

  const handleDeletePrompt = useCallback(
    (promptId: string) => {
      deletePromptMutation.mutate(promptId);
    },
    [deletePromptMutation]
  );

  const handleToggleVisibility = useCallback(
    (promptId: string, visibility: Visibility) => {
      updateVisibilityMutation.mutate({ id: promptId, visibility });
    },
    [updateVisibilityMutation]
  );

  const handlePlayGame = useCallback((gameId: string) => {
    window.open(`/game/${gameId}`, "_blank");
  }, []);

  // Main generation function
  const handleRun = useCallback(async () => {
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    if (!selectedThemeId) {
      toast.error("Please select a theme");
      return;
    }
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    setIsGenerating(true);
    setCompletedCount(0);
    generationAbortedRef.current = false;

    // Initialize outputs
    const initialOutputs: Record<string, CodelabOutput> = {};
    for (const model of selectedModels) {
      initialOutputs[model.id] = {
        modelSelectionId: model.id,
        modelKey: model.modelKey,
        modelName: model.modelName,
        status: "idle",
        code: "",
        gameId: null,
      };
    }
    setCurrentOutputs(initialOutputs);
    setActiveOutputTab(selectedModels[0]!.id);

    const completionStats = { completed: 0, errors: 0, total: selectedModels.length };

    try {
      // Create prompt first if not exists
      let promptId = existingPrompt?.id ?? selectedPromptId;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedThemeId,
          content: promptContent,
        });
        promptId = result.promptId;
        setSelectedPromptId(promptId);
      }

      const runGenerationForModel = async (model: CodelabModelSelection): Promise<void> => {
        if (generationAbortedRef.current) return;

        // Update status to reasoning
        setCurrentOutputs((prev) => ({
          ...prev,
          [model.id]: { ...prev[model.id]!, status: "reasoning" },
        }));

        try {
          let bufferedCodeDelta = "";
          let bufferedReasoningDelta = "";

          const flushBufferedDeltas = () => {
            if (bufferedReasoningDelta.length > 0) {
              setCurrentOutputs((prev) => ({
                ...prev,
                [model.id]: {
                  ...prev[model.id]!,
                  reasoning: (prev[model.id]?.reasoning ?? "") + bufferedReasoningDelta,
                },
              }));
              bufferedReasoningDelta = "";
            }

            if (bufferedCodeDelta.length > 0) {
              setCurrentOutputs((prev) => ({
                ...prev,
                [model.id]: {
                  ...prev[model.id]!,
                  code: (prev[model.id]?.code ?? "") + bufferedCodeDelta,
                },
              }));
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
                const newStatus = chunk.status as GenerationStatus;
                setCurrentOutputs((prev) => ({
                  ...prev,
                  [model.id]: { ...prev[model.id]!, status: newStatus },
                }));
              } else if (chunk.type === "reasoning-chunk" && "delta" in chunk) {
                bufferedReasoningDelta += chunk.delta as string;
              } else if (chunk.type === "chunk" && "delta" in chunk) {
                bufferedCodeDelta += chunk.delta as string;
              } else if (chunk.type === "complete" && "gameId" in chunk) {
                flushBufferedDeltas();
                completionStats.completed++;
                setCompletedCount(completionStats.completed);
                setCurrentOutputs((prev) => ({
                  ...prev,
                  [model.id]: {
                    ...prev[model.id]!,
                    status: "complete",
                    gameId: chunk.gameId as string,
                  },
                }));
              } else if (chunk.type === "error") {
                flushBufferedDeltas();
                completionStats.errors++;
                const errorMsg = "error" in chunk ? String(chunk.error) : "Generation failed";
                toast.error(`${model.modelName}: ${errorMsg}`);
                setCurrentOutputs((prev) => ({
                  ...prev,
                  [model.id]: {
                    ...prev[model.id]!,
                    status: "error",
                    error: errorMsg,
                  },
                }));
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
          console.error(`Generation error for ${model.modelKey}:`, error);
          setCurrentOutputs((prev) => ({
            ...prev,
            [model.id]: {
              ...prev[model.id]!,
              status: "error",
              error: errorMsg,
            },
          }));
        }
      };

      // Run with concurrency limit
      for (
        let index = 0;
        index < selectedModels.length;
        index += GENERATION_CONCURRENCY_LIMIT
      ) {
        const batch = selectedModels.slice(index, index + GENERATION_CONCURRENCY_LIMIT);
        await Promise.all(batch.map((model) => runGenerationForModel(model)));
      }

      // Add to run history
      const newRun: CodelabRunCell = {
        id: `run-${Date.now()}`,
        promptContent,
        gameName,
        themeId: selectedThemeId,
        selectedModels,
        outputs: currentOutputs,
        createdAt: Date.now(),
        promptId: promptId ?? undefined,
      };
      setRunHistory((prev) => [newRun, ...prev.slice(0, 49)]); // Keep last 50 runs

      // Show result toast
      if (completionStats.completed === completionStats.total) {
        toast.success(`All ${completionStats.total} games generated!`);
      } else if (completionStats.completed > 0) {
        toast.info(
          `${completionStats.completed}/${completionStats.total} games generated (${completionStats.errors} failed)`
        );
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
    gameName,
    selectedThemeId,
    selectedModels,
    existingPrompt,
    selectedPromptId,
    createPromptMutation,
    currentOutputs,
  ]);

  const handleLoadRun = useCallback((run: CodelabRunCell) => {
    setPromptContent(run.promptContent);
    setGameName(run.gameName);
    setSelectedThemeId(run.themeId);
    setSelectedModels(run.selectedModels);
    setCurrentOutputs(run.outputs);
    setActiveOutputTab(Object.keys(run.outputs)[0] ?? null);
  }, []);

  const handleDeleteRun = useCallback((runId: string) => {
    setRunHistory((prev) => prev.filter((r) => r.id !== runId));
  }, []);

  // Calculate derived values
  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);
  const codelabVersions: CodelabVersion[] =
    versions?.map((v) => ({
      id: v.id,
      version: v.version,
      createdAt: v.createdAt,
    })) ?? [];

  const isForking = !!resolvedSearchParams?.forkId;

  if (!mounted || promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 min-h-0">
        <CodelabSidebar
          credits={credits?.balance ?? null}
          themes={themes?.map((t) => ({ id: t.id, title: t.title })) ?? []}
          themesLoading={themesLoading}
          selectedThemeId={selectedThemeId}
          onSelectTheme={setSelectedThemeId}
          prompts={
            prompts?.map((p) => ({
              id: p.id,
              content: p.content,
              version: p.version,
              updatedAt: p.updatedAt,
              visibility: p.visibility,
            })) ?? []
          }
          promptsLoading={promptsLoading}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={handleSelectPrompt}
          onNewPrompt={handleNewPrompt}
          onDeletePrompt={handleDeletePrompt}
          onTogglePromptVisibility={handleToggleVisibility}
          deletingPromptId={deletingPromptId}
        >
          {modelsLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : modelMetadata ? (
            <CodelabModelPicker
              modelMetadata={modelMetadata}
              selectedModels={selectedModels}
              onAddModel={handleAddModel}
              onRemoveModel={handleRemoveModel}
              apiKeys={
                apiKeys?.map((k) => ({
                  id: k.id,
                  provider: k.provider,
                  name: k.name,
                  isActive: k.isActive,
                  createdAt: k.createdAt,
                  lastUsedAt: k.lastUsedAt,
                })) as CodelabApiKey[] | undefined
              }
              disabled={isGenerating}
            />
          ) : null}
        </CodelabSidebar>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)]">
          <h1 className="text-sm font-semibold">Codelab</h1>
          <div className="flex items-center gap-2">
            {isForking && !existingPrompt && (
              <button
                type="button"
                onClick={handleFork}
                disabled={forkPromptMutation.isPending}
                className="px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:brightness-105 disabled:opacity-50"
              >
                {forkPromptMutation.isPending ? "Forking..." : "Fork"}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Prompt Cell */}
          <CodelabPromptCell
            cellId="current"
            promptContent={promptContent}
            onPromptChange={setPromptContent}
            gameName={gameName}
            onGameNameChange={setGameName}
            selectedModels={selectedModels}
            totalCredits={totalCredits}
            isGenerating={isGenerating}
            completedCount={completedCount}
            onRun={handleRun}
            onSave={handleSave}
            versions={codelabVersions}
            currentVersion={existingPrompt?.version}
            onLoadVersion={handleLoadVersion}
            savePending={createPromptMutation.isPending || updatePromptMutation.isPending}
            isActive={true}
          />

          {/* Output Cell */}
          {(Object.keys(currentOutputs).length > 0 || isGenerating) && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <span className="text-xs font-mono text-[var(--muted-foreground)]">Out [ ]:</span>
              </div>
              <div className="p-3">
                <CodelabOutputCell
                  outputs={currentOutputs}
                  activeOutputTab={activeOutputTab}
                  onOutputTabChange={setActiveOutputTab}
                  onPlayGame={handlePlayGame}
                />
              </div>
            </div>
          )}

          {/* Run History */}
          <CodelabRunHistory
            runs={runHistory}
            onLoadRun={handleLoadRun}
            onDeleteRun={handleDeleteRun}
            onPlayGame={handlePlayGame}
          />
        </div>
      </main>
    </div>
  );
}
