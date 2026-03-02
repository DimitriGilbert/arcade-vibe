"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArcadeButton } from "@/components/arcade";
import { Loader2, Save, Play, Copy, ExternalLink } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import {
  ModelSelector,
  type ModelMetadata,
  type ApiKey,
  toModelConfig,
} from "../../components/editor/model-selector";
import {
  VersionComparison,
  type PromptVersion,
} from "../../components/editor/version-history";
import { EditorSidebar } from "../../components/editor/editor-sidebar";
import { VersionSelector } from "../../components/editor/version-selector";
import { EditorTabs } from "../../components/editor/editor-tabs";
import { SelectedModelsList } from "../../components/editor/selected-models-list";
import { EditableTitle } from "@/components/creator/shared";
import type { GameMedia } from "@/lib/trpc-types";
import type {
  ModelSelection,
  GenerationStatus,
} from "../../components/editor/model-types";
import { MAX_MODELS } from "../../components/editor/model-types";
import {
  useGenerationsStore,
  useGenerationGameId,
  useCompletedCount,
  type GenerationEntry,
} from "@/stores/generations-store";

interface EditorPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

const EDITOR_STORAGE_KEY = "arcade-vibe-editor-state";
const GENERATION_CONCURRENCY_LIMIT = 2;

interface PersistedEditorState {
  promptContent: string;
  promptTitle: string;
  selectedTheme: string;
  selectedModels: ModelSelection[];
  timestamp: number;
}

function loadPersistedState(): PersistedEditorState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(EDITOR_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedEditorState;
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(EDITOR_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistState(state: Omit<PersistedEditorState, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const toStore: PersistedEditorState = { ...state, timestamp: Date.now() };
    localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Storage might be full or disabled
  }
}

function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EDITOR_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export default function EditorPage({ searchParams }: EditorPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined }),
  );
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [promptTitle, setPromptTitle] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedModels, setSelectedModels] = useState<ModelSelection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationAbortedRef = useRef(false);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [activeOutputTab, setActiveOutputTab] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Use Zustand store for generations (must be after activeOutputTab declaration)
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

  // Version comparison state
  const [showComparison, setShowComparison] = useState(false);
  const [compareLeft, setCompareLeft] = useState<PromptVersion | null>(null);
  const [compareRight, setCompareRight] = useState<PromptVersion | null>(null);

  // Media state for generation
  const [gameMedia, setGameMedia] = useState<GameMedia>({
    strudelCode: null,
    mediaUrls: null,
  });

  // Load persisted state on mount (client-side only)
  useEffect(() => {
    const persistedState = loadPersistedState();
    if (persistedState) {
      setPromptContent(persistedState.promptContent);
      setPromptTitle(persistedState.promptTitle);
      setSelectedTheme(persistedState.selectedTheme);
      setSelectedModels(persistedState.selectedModels);
    }
    setMounted(true);
  }, []);

  // Fetch themes using direct tRPC client
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: () => trpcClient.themes.list.query(),
  });

  // Use first theme as default (no separate API call)
  const currentTheme = themes?.[0];
  const themeMediaConfig = currentTheme?.mediaConfig ?? undefined;
  const showMediaTab = themeMediaConfig?.enabled === true;

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

  // Extract models from metadata for backward compatibility
  const models = modelMetadata?.models;

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

  // Fetch prompts for sidebar - all prompts or filtered by theme
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

  // Fetch prompt versions for history
  const { data: versions } = useQuery({
    queryKey: ["prompt-versions", existingPrompt?.id ?? selectedPromptId],
    queryFn: async () => {
      const promptId = existingPrompt?.id ?? selectedPromptId;
      if (!promptId) return [];
      return await trpcClient.prompts.listVersions.query({
        promptId,
      });
    },
    enabled: !!(existingPrompt?.id ?? selectedPromptId),
  });

  // Initialize prompt content when existing prompt loads (from URL params)
  useEffect(() => {
    if (existingPrompt && !promptContent) {
      setPromptContent(existingPrompt.content);
      setPromptTitle(existingPrompt.title ?? "");
      setSelectedTheme(existingPrompt.themeId);
      setSelectedPromptId(existingPrompt.id);
      setSelectedVersionId(existingPrompt.id);
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
      promptTitle,
      selectedTheme,
      selectedModels,
    });
  }, [
    promptContent,
    promptTitle,
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
    mutationFn: async (input: { themeId: string; content: string; title: string }) => {
      const result = await trpcClient.prompts.create.mutate({
        themeId: input.themeId,
        content: input.content,
        title: input.title,
        tokenizer: "gpt-4",
        visibility: "private",
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt created successfully!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      void queryClient.invalidateQueries({ queryKey: ["prompt"] });
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
    mutationFn: async (input: { id: string; content: string; title: string }) => {
      const result = await trpcClient.prompts.update.mutate({
        id: input.id,
        content: input.content,
        title: input.title,
        tokenizer: "gpt-4",
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt updated successfully!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      void queryClient.invalidateQueries({ queryKey: ["prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      if (data.promptId) {
        setSelectedPromptId(data.promptId);
        setSelectedVersionId(data.promptId);
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
      toast.success("Prompt forked successfully!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      window.location.href = `/editor?promptId=${data.promptId}`;
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
    mutationFn: async (input: { id: string; visibility: "private" | "public" | "public_on_freeze" }) => {
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

  const handleDeletePrompt = useCallback((promptId: string) => {
    softDeletePromptMutation.mutate({ id: promptId });
  }, [softDeletePromptMutation]);

  const handleTogglePromptVisibility = useCallback((promptId: string, visibility: "private" | "public" | "public_on_freeze") => {
    updatePromptVisibilityMutation.mutate({ id: promptId, visibility });
  }, [updatePromptVisibilityMutation]);

  // Handle adding a model to the selection
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

  // Handle removing a model from the selection
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

  // Generate content using tRPC streaming API - parallel multi-model
  const handleGenerate = useCallback(async () => {
    if (!promptTitle.trim() || promptTitle.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
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

    // Get theme ID
    const currentThemeId = existingPrompt?.themeId || selectedTheme;
    if (!currentThemeId) {
      toast.error("Theme not found");
      return;
    }

    setIsGenerating(true);
    setActiveTab("output");
    generationAbortedRef.current = false;

    // Track completion count with ref to avoid stale closure
    const completionStats = { completed: 0, errors: 0, total: selectedModels.length };

    // Initialize all generations using Zustand store
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
      let promptId = existingPrompt?.id ?? selectedPromptId;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedTheme,
          content: promptContent,
          title: promptTitle.trim(),
        });
        promptId = result.promptId;
        setSelectedPromptId(promptId);
      }

      const runGenerationForModel = async (model: ModelSelection): Promise<void> => {
        if (generationAbortedRef.current) return;

        // Update status to reasoning
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
            name: undefined,
            mediaUrls: gameMedia.mediaUrls ?? undefined,
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
      
      // Show aggregate toast based on tracked stats
      if (completionStats.completed === completionStats.total) {
        toast.success(`All ${completionStats.total} games generated successfully!`);
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
    }
  }, [
    promptTitle,
    promptContent,
    existingPrompt,
    selectedTheme,
    selectedModels,
    createPromptMutation,
    selectedPromptId,
    gameMedia.mediaUrls,
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
    if (!promptTitle.trim() || promptTitle.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
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
        title: promptTitle.trim(),
      });
    } else {
      createPromptMutation.mutate({
        themeId: selectedTheme,
        content: promptContent,
        title: promptTitle.trim(),
      });
    }
  }, [
    selectedTheme,
    promptTitle,
    promptContent,
    existingPrompt,
    selectedPromptId,
    updatePromptMutation,
    createPromptMutation,
  ]);

  const handleCompare = (left: PromptVersion, right: PromptVersion) => {
    setCompareLeft(left);
    setCompareRight(right);
    setShowComparison(true);
  };

  const handleFork = useCallback(() => {
    if (!resolvedSearchParams?.forkId) return;
    forkPromptMutation.mutate({ forkId: resolvedSearchParams.forkId });
  }, [resolvedSearchParams?.forkId, forkPromptMutation]);

  // New handlers for sidebar layout
  const handleSelectPrompt = useCallback(async (promptId: string) => {
    try {
      const prompt = await trpcClient.prompts.getById.query({ id: promptId });
      if (prompt) {
        setPromptContent(prompt.content);
        setPromptTitle(prompt.title ?? "");
        setSelectedPromptId(prompt.id);
        setSelectedVersionId(prompt.id);
        setSelectedTheme(prompt.themeId);
        setActiveTab("editor");
      }
    } catch (error) {
      toast.error("Failed to load prompt");
      console.error(error);
    }
  }, []);

  const handleNewPrompt = useCallback(() => {
    setPromptContent("");
    setPromptTitle("");
    setSelectedPromptId(null);
    setSelectedVersionId(null);
    setActiveTab("editor");
    setSelectedModels([]);
    clearGenerations();
    setActiveOutputTab(null);
  }, [clearGenerations]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleOutputTabChange = useCallback((id: string) => {
    setActiveOutputTab(id);
  }, []);

  const handleSelectVersion = useCallback(
    async (versionId: string) => {
      try {
        // Find the version in our versions data
        const versionData = versions?.find(
          (v: { id: string }) => v.id === versionId,
        );
        if (versionData) {
          setPromptContent(versionData.content);
          setSelectedVersionId(versionId);
        }
      } catch (error) {
        toast.error("Failed to load version");
        console.error(error);
      }
    },
    [versions],
  );

  const handleNewVersion = useCallback(() => {
    setActiveTab("editor");
  }, []);

  const handleMediaChange = useCallback((media: GameMedia) => {
    setGameMedia(media);
  }, []);

  if (promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const isEditing = !!(existingPrompt ?? selectedPromptId);
  const isForking = !!resolvedSearchParams?.forkId;
  const currentPrompt =
    existingPrompt ??
    (selectedPromptId ? { id: selectedPromptId, version: 1 } : null);

  const activeModel = selectedModels.find((m) => m.id === activeOutputTab);

  // completedCount and totalCount come from store hooks above
  const progressText = isGenerating && selectedModels.length > 1
    ? `Generating ${completedCount}/${selectedModels.length}...`
    : null;

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 bg-background min-h-screen" />
      <div className="relative h-full min-h-0 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 min-h-0 border-b md:border-b-0 md:border-r border-[var(--border)] shrink-0 p-4 overflow-y-auto">
          <EditorSidebar
            selectedTheme={selectedTheme}
            onSelectTheme={setSelectedTheme}
            themes={themes?.map((t: { id: string; title: string }) => ({
              id: t.id,
              title: t.title,
            }))}
            themesLoading={themesLoading}
            prompts={myPrompts?.map(
              (p: {
                id: string;
                title: string | null;
                content: string;
                version: number;
                updatedAt: string;
                visibility?: "private" | "public" | "public_on_freeze";
              }) => ({
                id: p.id,
                title: p.title,
                content: p.content,
                version: p.version,
                updatedAt: p.updatedAt,
                visibility: p.visibility,
              }),
            )}
            promptsLoading={promptsLoading}
            selectedPromptId={selectedPromptId}
            onSelectPrompt={handleSelectPrompt}
            onNewPrompt={handleNewPrompt}
            onDeletePrompt={handleDeletePrompt}
            onTogglePromptVisibility={handleTogglePromptVisibility}
            deletingPromptId={deletingPromptId}
          >
            {/* Selected Models List */}
            <div className="mb-4">
              <SelectedModelsList
                models={selectedModels}
                onRemoveModel={handleRemoveModel}
                disabled={isGenerating}
              />
            </div>

            {/* Model Selector */}
            {modelsLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : modelMetadata ? (
              <ModelSelector
                modelMetadata={modelMetadata}
                existingModelKeys={selectedModels.map((m) => m.modelKey)}
                onAddModel={handleAddModel}
                apiKeys={apiKeys as ApiKey[] | undefined}
                disabled={isGenerating || selectedModels.length >= MAX_MODELS}
              />
            ) : null}
          </EditorSidebar>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
          {/* Header with title, credits and fork button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
            {/* Left: Fork button + Progress text */}
            <div className="flex items-center gap-2 min-w-0">
              {isForking && (
                <ArcadeButton
                  variant="outline"
                  onClick={handleFork}
                  disabled={forkPromptMutation.isPending}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {forkPromptMutation.isPending ? "Forking..." : "Fork"}
                </ArcadeButton>
              )}
              {progressText && (
                <span className="text-sm text-[var(--muted-foreground)]">
                  {progressText}
                </span>
              )}
            </div>
            {/* Center: EditableTitle + Version badge */}
            <div className="flex items-center gap-2 justify-center flex-1 px-4">
              <EditableTitle
                value={promptTitle}
                onChange={setPromptTitle}
                placeholder="Untitled Prompt"
                disabled={isGenerating}
                maxWidth="max-w-[240px]"
              />
              {isEditing && currentPrompt && (
                <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                  v{currentPrompt.version}
                </span>
              )}
            </div>
            {/* Right: Credits badge */}
            {credits && (
              <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                {credits.balance} credits
              </span>
            )}
          </div>

          {/* Version Selector - only when editing existing prompt */}
          {currentPrompt && versions && versions.length > 0 && (
            <VersionSelector
              versions={versions.map(
                (v: { id: string; version: number; createdAt: string }) => ({
                  id: v.id,
                  version: v.version,
                  createdAt: v.createdAt,
                }),
              )}
              currentVersion={currentPrompt.version}
              selectedVersionId={selectedVersionId}
              onSelectVersion={handleSelectVersion}
              onNewVersion={handleNewVersion}
            />
          )}

          {/* Tabs */}
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <EditorTabs
              promptContent={promptContent}
              onPromptChange={setPromptContent}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              promptId={selectedPromptId}
              themeMediaConfig={undefined}
              showMediaTab={false}
              onMediaChange={handleMediaChange}
              selectedModels={selectedModels}
              activeOutputTab={activeOutputTab}
              onOutputTabChange={handleOutputTabChange}
            />
          </div>

          {/* Action Bar */}
          <div className="p-4 border-t border-[var(--border)] shrink-0">
            <div className="flex gap-2">
              <ArcadeButton
                onClick={handleSave}
                disabled={
                  !promptTitle.trim() ||
                  promptTitle.trim().length < 3 ||
                  !promptContent.trim() ||
                  createPromptMutation.isPending ||
                  updatePromptMutation.isPending
                }
                className="flex-1"
              >
                {createPromptMutation.isPending ||
                updatePromptMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Update" : "Save"}
                  </>
                )}
              </ArcadeButton>
              <ArcadeButton
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  !promptTitle.trim() ||
                  promptTitle.trim().length < 3 ||
                  !promptContent.trim() ||
                  selectedModels.length === 0
                }
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {selectedModels.length > 1 ? `Generating ${completedCount}/${selectedModels.length}...` : "Generating..."}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate ({selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""})
                  </>
                )}
              </ArcadeButton>
              {activeGameId && !isGenerating && (
                <ArcadeButton
                  variant="glow"
                  onClick={() =>
                    window.open(`/game/${activeGameId}`, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Play Game
                </ArcadeButton>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Version Comparison Dialog */}
      {showComparison && compareLeft && compareRight && (
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version Comparison</DialogTitle>
              <DialogDescription>
                Comparing v{compareLeft.version} with v{compareRight.version}
              </DialogDescription>
            </DialogHeader>
            <VersionComparison
              leftVersion={compareLeft}
              rightVersion={compareRight}
              onClose={() => setShowComparison(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
