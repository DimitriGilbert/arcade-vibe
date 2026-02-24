"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { Loader2, Play, Save, Copy, ExternalLink, Pencil, Check, X } from "lucide-react";
import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { FeedbackButton } from "@/components/feedback";
import { trpcClient } from "@/utils/trpc";
import type { Visibility, Game } from "@/lib/trpc-types";
import {
  InboxSidebar,
  InboxModelSelector,
  InboxOutputPanel,
  InboxGenerationHistory,
  InboxModelChips,
  type ModelSelection,
  type ModelMetadata,
  type ApiKey,
  type GenerationStatus,
  toModelConfig,
  MAX_MODELS,
} from "@/components/creator/inbox";
import {
  useGenerationsStore,
  useGenerationGameId,
  useCompletedCount,
  type GenerationEntry,
} from "@/stores/generations-store";
import { editorFeedbackSchema, editorFeedbackFields } from "@/lib/feedback-schemas";

interface InboxPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

const STORAGE_KEY = "arcade-vibe-creator-inbox";
const GENERATION_CONCURRENCY_LIMIT = 2;

interface PersistedInboxState {
  promptContent: string;
  gameName: string;
  selectedTheme: string;
  selectedModels: ModelSelection[];
  timestamp: number;
}

function loadPersistedState(): PersistedInboxState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedInboxState;
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistState(state: Omit<PersistedInboxState, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const toStore: PersistedInboxState = { ...state, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Storage might be full or disabled
  }
}

function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export default function InboxPage({ searchParams }: InboxPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined }),
  );
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedModels, setSelectedModels] = useState<ModelSelection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationAbortedRef = useRef(false);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [gameName, setGameName] = useState("");
  const [isEditingGameName, setIsEditingGameName] = useState(false);
  const [selectedGameFromHistory, setSelectedGameFromHistory] = useState<Game | null>(null);

  // Generations store hooks
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

  // Use first theme as default
  const currentTheme = themes?.[0];

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
    queryKey: [
      "prompt",
      resolvedSearchParams?.promptId || resolvedSearchParams?.forkId,
    ],
    queryFn: async () => {
      const id = resolvedSearchParams?.promptId || resolvedSearchParams?.forkId;
      if (!id) return null;
      return await trpcClient.prompts.getById.query({ id });
    },
    enabled: !!(resolvedSearchParams?.promptId || resolvedSearchParams?.forkId),
  });

  // Fetch prompts for sidebar
  const { data: myPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts-by-theme", selectedTheme],
    queryFn: async () => {
      if (selectedTheme) {
        return await trpcClient.prompts.listMineByTheme.query({
          themeId: selectedTheme,
        });
      }
      return await trpcClient.prompts.listMine.query();
    },
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
    }
  }, [existingPrompt, promptContent]);

  // Auto-select current theme on initial load
  useEffect(() => {
    if (currentTheme && !selectedTheme && !existingPrompt) {
      setSelectedTheme(currentTheme.id);
    }
  }, [currentTheme, selectedTheme, existingPrompt]);

  // Persist editor state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (resolvedSearchParams?.promptId || resolvedSearchParams?.forkId || existingPrompt) {
      return;
    }
    persistState({
      promptContent,
      gameName,
      selectedTheme,
      selectedModels,
    });
  }, [
    promptContent,
    gameName,
    selectedTheme,
    selectedModels,
    resolvedSearchParams?.promptId,
    resolvedSearchParams?.forkId,
    existingPrompt,
  ]);

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
    mutationFn: async (input: { themeId: string; content: string }) => {
      const result = await trpcClient.prompts.create.mutate({
        themeId: input.themeId,
        content: input.content,
        tokenizer: "gpt-4",
        visibility: "private",
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt created!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
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
      const result = await trpcClient.prompts.update.mutate({
        id: input.id,
        content: input.content,
        tokenizer: "gpt-4",
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt updated!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update prompt");
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
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      window.location.href = `/creator/inbox?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  // Soft delete prompt mutation
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const softDeletePromptMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      setDeletingPromptId(input.id);
      const result = await trpcClient.prompts.softDelete.mutate({
        id: input.id,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt deleted!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
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

  // Update prompt visibility mutation
  const updatePromptVisibilityMutation = useMutation({
    mutationFn: async (input: { id: string; visibility: Visibility }) => {
      const result = await trpcClient.prompts.updateVisibility.mutate({
        id: input.id,
        visibility: input.visibility,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Prompt is now ${data.visibility}`);
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  // Handlers
  const handleDeletePrompt = useCallback((promptId: string) => {
    softDeletePromptMutation.mutate({ id: promptId });
  }, [softDeletePromptMutation]);

  const handleTogglePromptVisibility = useCallback((promptId: string, visibility: Visibility) => {
    updatePromptVisibilityMutation.mutate({ id: promptId, visibility });
  }, [updatePromptVisibilityMutation]);

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
    setShowModelSelector(false);
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

  // Generation function
  const handleGenerate = useCallback(async () => {
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    if (!existingPrompt && !selectedTheme) {
      toast.error("Please select a theme");
      return;
    }

    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    const currentThemeId = existingPrompt?.themeId || selectedTheme;
    if (!currentThemeId) {
      toast.error("Theme not found");
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
      // Save prompt first (create new or update existing)
      let promptId = existingPrompt?.id ?? selectedPromptId;
      if (promptId) {
        const result = await updatePromptMutation.mutateAsync({
          id: promptId,
          content: promptContent,
        });
        promptId = result.promptId;
      } else {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedTheme,
          content: promptContent,
        });
        promptId = result.promptId;
        setSelectedPromptId(promptId);
      }

      const runGenerationForModel = async (model: ModelSelection): Promise<void> => {
        if (generationAbortedRef.current) return;

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
          console.error(`Generation error for ${model.modelKey}:`, error);
          updateGenerationError(model.id, errorMsg);
        }
      };

      for (
        let index = 0;
        index < selectedModels.length;
        index += GENERATION_CONCURRENCY_LIMIT
      ) {
        const batch = selectedModels.slice(
          index,
          index + GENERATION_CONCURRENCY_LIMIT,
        );
        await Promise.all(batch.map((model) => runGenerationForModel(model)));
      }
      
      if (completionStats.completed === completionStats.total) {
        toast.success(`All ${completionStats.total} games generated!`);
      } else if (completionStats.completed > 0) {
        toast.info(`${completionStats.completed}/${completionStats.total} games generated (${completionStats.errors} failed)`);
      } else {
        toast.error("All generations failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate games",
      );
    } finally {
      setIsGenerating(false);
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
    }
  }, [
    promptContent,
    gameName,
    existingPrompt,
    selectedTheme,
    selectedModels,
    createPromptMutation,
    updatePromptMutation,
    selectedPromptId,
    setMultipleGenerations,
    updateGenerationStatus,
    updateGenerationCode,
    updateGenerationReasoning,
    updateGenerationGameId,
    updateGenerationError,
    queryClient,
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
    const promptId = existingPrompt?.id ?? selectedPromptId;
    if (promptId) {
      updatePromptMutation.mutate({
        id: promptId,
        content: promptContent,
      });
    } else {
      createPromptMutation.mutate({
        themeId: selectedTheme,
        content: promptContent,
      });
    }
  }, [
    selectedTheme,
    promptContent,
    existingPrompt,
    selectedPromptId,
    updatePromptMutation,
    createPromptMutation,
  ]);

  const handleFork = useCallback(() => {
    if (!resolvedSearchParams?.forkId) return;
    forkPromptMutation.mutate({ forkId: resolvedSearchParams.forkId });
  }, [resolvedSearchParams?.forkId, forkPromptMutation]);

  const handleSelectPrompt = useCallback(async (promptId: string) => {
    try {
      const prompt = await trpcClient.prompts.getById.query({ id: promptId });
      if (prompt) {
        setPromptContent(prompt.content);
        setSelectedPromptId(prompt.id);
        setSelectedTheme(prompt.themeId);
        // Auto-collapse left sidebar and expand right sidebar when prompt is selected
        setLeftSidebarCollapsed(true);
        setRightSidebarCollapsed(false);
        setSelectedGameFromHistory(null);
        // Clear generation state when switching prompts
        setSelectedModels([]);
        clearGenerations();
        setActiveOutputTab(null);
        setGameName("");
      }
    } catch (error) {
      toast.error("Failed to load prompt");
      console.error(error);
    }
  }, [clearGenerations]);

  const handleNewPrompt = useCallback(() => {
    setPromptContent("");
    setGameName("");
    setSelectedPromptId(null);
    setSelectedModels([]);
    clearGenerations();
    setActiveOutputTab(null);
    setSelectedGameFromHistory(null);
    setRightSidebarCollapsed(true);
  }, [clearGenerations]);

  // Handler for selecting a game from history - must be defined before any conditional code
  const handleSelectGameFromHistory = useCallback((game: Game) => {
    setSelectedGameFromHistory(game);
  }, []);

  if (!mounted || promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const isForking = !!resolvedSearchParams?.forkId;
  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden min-h-screen">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Inbox</h1>
          {/* Action buttons moved to header */}
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={handleNewPrompt}
            disabled={isGenerating}
          >
            New
          </ArcadeButton>
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={
              !promptContent.trim() ||
              createPromptMutation.isPending ||
              updatePromptMutation.isPending
            }
          >
            {createPromptMutation.isPending || updatePromptMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save
          </ArcadeButton>
          <ArcadeButton
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || !promptContent.trim() || selectedModels.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {selectedModels.length > 1 ? `${completedCount}/${selectedModels.length}` : "..."}
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Generate
                {selectedModels.length > 0 && (
                  <span className="ml-1 opacity-80">({totalCredits}cr)</span>
                )}
              </>
            )}
          </ArcadeButton>
          {isForking && (
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={handleFork}
              disabled={forkPromptMutation.isPending}
            >
              <Copy className="h-3 w-3" />
              {forkPromptMutation.isPending ? "Forking..." : "Fork"}
            </ArcadeButton>
          )}
          {isGenerating && selectedModels.length > 1 && (
            <span className="text-sm text-[var(--muted-foreground)]">
              Generating {completedCount}/{selectedModels.length}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {credits && (
            <ArcadeBadge text={`${credits.balance} credits`} variant="neon" />
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 flex">
        {/* Left Sidebar - Theme/Prompts - Collapsible */}
        <InboxSidebar
          selectedTheme={selectedTheme}
          onSelectTheme={(themeId) => {
            setSelectedTheme(themeId);
            // Clear prompt-related state when theme changes
            setSelectedPromptId(null);
            setPromptContent("");
            setSelectedModels([]);
            clearGenerations();
            setActiveOutputTab(null);
          }}
          themes={themes?.map((t) => ({ id: t.id, title: t.title }))}
          themesLoading={themesLoading}
          prompts={myPrompts?.map((p) => ({
            id: p.id,
            content: p.content,
            version: p.version,
            updatedAt: p.updatedAt,
            visibility: p.visibility,
          }))}
          promptsLoading={promptsLoading}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={handleSelectPrompt}
          onNewPrompt={handleNewPrompt}
          onDeletePrompt={handleDeletePrompt}
          onTogglePromptVisibility={handleTogglePromptVisibility}
          deletingPromptId={deletingPromptId}
          isCollapsed={leftSidebarCollapsed}
          onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        />

        {/* History Sidebar - Between prompts and main content */}
        {selectedPromptId && (
          <InboxGenerationHistory
            promptId={selectedPromptId}
            onSelectGame={handleSelectGameFromHistory}
            selectedGameId={selectedGameFromHistory?.id}
            isCollapsed={rightSidebarCollapsed}
            onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        )}

        {/* Main Content - Compose Area */}
        <main className="flex-1 min-h-0 flex flex-col min-w-0">

          {/* Model Selection Area */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)] space-y-3">
            {/* Model Chips Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Models:</span>
              <InboxModelChips
                models={selectedModels}
                onRemoveModel={handleRemoveModel}
                onAddModelClick={() => setShowModelSelector(!showModelSelector)}
                activeModelId={activeOutputTab}
                onModelClick={setActiveOutputTab}
                disabled={isGenerating}
              />
            </div>

            {/* Model Selector Dropdown */}
            {showModelSelector && (
              <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--card)]">
                {modelsLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                  </div>
                ) : modelMetadata ? (
                  <InboxModelSelector
                    modelMetadata={modelMetadata}
                    existingModelKeys={selectedModels.map((m) => m.modelKey)}
                    onAddModel={handleAddModel}
                    apiKeys={(apiKeys as ApiKey[] | undefined)?.filter((k): k is ApiKey => k.isActive)}
                    disabled={isGenerating || selectedModels.length >= MAX_MODELS}
                  />
                ) : null}
              </div>
            )}
          </div>

          {/* Editor + Output Area */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
            {/* Left: Prompt Editor */}
            <div className="flex-1 min-h-[200px] lg:min-h-0 flex flex-col border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
              <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
                {/* Game Name - Editable */}
                <div className="flex items-center gap-2">
                  {isEditingGameName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        className="px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="Game name"
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingGameName(false)}
                        className="p-1 hover:bg-[var(--muted)] rounded"
                      >
                        <Check className="h-3 w-3 text-green-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingGameName(false);
                          setGameName("");
                        }}
                        className="p-1 hover:bg-[var(--muted)] rounded"
                      >
                        <X className="h-3 w-3 text-[var(--destructive)]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingGameName(true)}
                      className="group flex items-center gap-1.5 text-xs font-medium hover:text-[var(--primary)] transition-colors"
                    >
                      <span>{gameName || "Prompt"}</span>
                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={
                    !promptContent.trim() ||
                    createPromptMutation.isPending ||
                    updatePromptMutation.isPending
                  }
                >
                  {createPromptMutation.isPending || updatePromptMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                </ArcadeButton>
              </div>
              <div className="flex-1 min-h-0 [&_.monaco-editor_.margin]:!pl-4 [&_.monaco-editor_.lines-content]:!pl-4">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={promptContent}
                  onChange={(value) => setPromptContent(value ?? "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: "off",
                    wordWrap: "on",
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    folding: false,
                    glyphMargin: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0,
                  }}
                />
              </div>
            </div>

            {/* Right: Output Panel */}
            <div className="flex-1 min-h-[200px] lg:min-h-0 flex flex-col border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
              <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
                <span className="text-xs font-medium">
                  {selectedGameFromHistory ? `Game: ${selectedGameFromHistory.name ?? "Untitled"}` : "Output"}
                </span>
                {selectedGameFromHistory ? (
                  <ArcadeButton
                    variant="glow"
                    size="sm"
                    onClick={() => window.open(`/game/${selectedGameFromHistory.id}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Play
                  </ArcadeButton>
                ) : activeGameId && !isGenerating ? (
                  <ArcadeButton
                    variant="glow"
                    size="sm"
                    onClick={() => window.open(`/game/${activeGameId}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Play
                  </ArcadeButton>
                ) : null}
                {selectedGameFromHistory && (
                  <ArcadeButton
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGameFromHistory(null)}
                  >
                    <X className="h-3 w-3" />
                  </ArcadeButton>
                )}
              </div>
              <div className="flex-1 min-h-0 p-2">
                <InboxOutputPanel
                  activeOutputTab={activeOutputTab}
                  selectedModels={selectedModels}
                  onOutputTabChange={setActiveOutputTab}
                  selectedGameFromHistory={selectedGameFromHistory}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Feedback Button */}
      <div className="absolute bottom-4 right-4 z-50">
        <FeedbackButton
          schema={editorFeedbackSchema}
          fields={editorFeedbackFields}
          subject="Inbox Editor Feedback"
          label="Feedback"
          variant="outline"
          description="Help us improve the Inbox editor. Share your thoughts on the layout and features."
        />
      </div>
    </div>
  );
}
