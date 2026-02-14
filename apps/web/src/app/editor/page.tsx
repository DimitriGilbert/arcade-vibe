"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import type { GameMedia } from "@/lib/trpc-types";

interface EditorPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

export default function EditorPage({ searchParams }: EditorPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined }),
  );

  // Core state
  const [promptContent, setPromptContent] = useState("");
  const [gameName, setGameName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedGameId, setGeneratedGameId] = useState<string | null>(null);

  // New state for sidebar layout
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [reasoningEnabled, setReasoningEnabled] = useState(true);
  const [reasoningMaxTokens, setReasoningMaxTokens] = useState(2000);

  // Version comparison state
  const [showComparison, setShowComparison] = useState(false);
  const [compareLeft, setCompareLeft] = useState<PromptVersion | null>(null);
  const [compareRight, setCompareRight] = useState<PromptVersion | null>(null);

  // Media state for generation
  const [gameMedia, setGameMedia] = useState<GameMedia>({
    strudelCode: null,
    mediaUrls: null,
  });

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
      toast.success("Prompt created successfully!");
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
      toast.success("Prompt updated successfully!");
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
      window.location.href = `/editor?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  // Generate content using tRPC streaming API
  const handleGenerate = useCallback(async () => {
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }
    if (!existingPrompt && !selectedTheme) {
      toast.error("Please select a theme");
      return;
    }

    const modelData = models?.find((m) => m.modelName === selectedModel);
    if (!modelData) {
      toast.error("Invalid model selected");
      return;
    }

    // Get theme ID
    const currentThemeId = existingPrompt?.themeId || selectedTheme;
    if (!currentThemeId) {
      toast.error("Theme not found");
      return;
    }

    setIsGenerating(true);
    setGeneratedCode("");
    setGeneratedGameId(null);
    setActiveTab("output"); // Auto-switch to output tab

    try {
      // Create new prompt first if not exists
      let promptId = existingPrompt?.id ?? selectedPromptId;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedTheme,
          content: promptContent,
        });
        promptId = result.promptId;
        setSelectedPromptId(promptId);
      }

      // Use tRPC streaming procedure
      const stream = await trpcClient.generate.streamGeneration.mutate({
        promptId,
        modelKey: selectedModel,
        apiKeyId: selectedApiKeyId ?? undefined,
        name: gameName.trim() || undefined,
        mediaUrls: gameMedia.mediaUrls ?? undefined,
        reasoningEnabled,
        reasoningMaxTokens,
      });

      for await (const chunk of stream) {
        if (chunk.type === "chunk" && "code" in chunk) {
          setGeneratedCode(chunk.code);
        } else if (chunk.type === "complete" && "gameId" in chunk) {
          setIsGenerating(false);
          setGeneratedGameId(chunk.gameId);
          toast.success("Game generated and saved successfully!");
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      setIsGenerating(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate game",
      );
    }
  }, [
    promptContent,
    gameName,
    existingPrompt,
    selectedTheme,
    selectedModel,
    models,
    createPromptMutation,
    selectedPromptId,
    selectedApiKeyId,
    gameMedia.mediaUrls,
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
    setSelectedPromptId(null);
    setSelectedVersionId(null);
    setActiveTab("editor");
    setGeneratedCode("");
    setGeneratedGameId(null);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
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

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 bg-background min-h-screen" />
      <div className="relative h-full flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[var(--border)] shrink-0 p-4 overflow-y-auto">
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
                content: string;
                version: number;
                updatedAt: string;
              }) => ({
                id: p.id,
                content: p.content,
                version: p.version,
                updatedAt: p.updatedAt,
              }),
            )}
            promptsLoading={promptsLoading}
            selectedPromptId={selectedPromptId}
            onSelectPrompt={handleSelectPrompt}
            onNewPrompt={handleNewPrompt}
          >
            {modelsLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : modelMetadata ? (
              <ModelSelector
                modelMetadata={modelMetadata}
                selectedModel={selectedModel}
                onSelectModel={(modelName) => {
                  if (modelName) {
                    setSelectedModel(modelName);
                  }
                }}
                apiKeys={apiKeys as ApiKey[] | undefined}
                selectedApiKeyId={selectedApiKeyId}
                onSelectApiKey={setSelectedApiKeyId}
                reasoningEnabled={reasoningEnabled}
                reasoningMaxTokens={reasoningMaxTokens}
                onReasoningChange={setReasoningEnabled}
                onReasoningMaxTokensChange={setReasoningMaxTokens}
              />
            ) : null}
          </EditorSidebar>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header with credits and fork button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
            {/* <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {isForking
                ? "Fork Prompt"
                : isEditing
                  ? "Edit Prompt"
                  : "Create Prompt"}
            </h1>
            {credits && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {credits.balance} credits available
              </p>
            )}
          </div> */}
            <div className="flex items-center gap-2">
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
            </div>
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
              generatedCode={generatedCode}
              isGenerating={isGenerating}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              promptId={selectedPromptId}
              generatedGameId={generatedGameId}
              themeMediaConfig={themeMediaConfig}
              showMediaTab={showMediaTab}
              onMediaChange={handleMediaChange}
            />
          </div>

          {/* Action Bar */}
          <div className="p-4 border-t border-[var(--border)] space-y-3 shrink-0">
            {/* Game Name Input */}
            <input
              type="text"
              placeholder="Game name (optional)"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--muted-foreground)]"
              maxLength={100}
            />
            <div className="flex gap-2">
              <ArcadeButton
                onClick={handleSave}
                disabled={
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
                disabled={isGenerating || !promptContent.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </ArcadeButton>
              {generatedGameId && !isGenerating && (
                <ArcadeButton
                  variant="glow"
                  onClick={() =>
                    window.open(`/game/${generatedGameId}`, "_blank")
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
