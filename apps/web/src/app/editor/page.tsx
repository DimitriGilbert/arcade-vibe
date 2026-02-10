"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArcadeButton } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import { ArcadeCard } from "@/components/arcade";
import { Loader2, Save, Play, GitBranch, Copy } from "lucide-react";
import { trpc, trpcClient } from "@/utils/trpc";
import {
  ModelSelector,
  type ModelConfig,
  type ModelTier,
  getCreditCostByTier,
  toModelConfig,
} from "./components/model-selector";
import {
  VersionHistory,
  VersionComparison,
  type PromptVersion,
} from "./components/version-history";
import { StreamingCodeViewer } from "@/components/streaming-code-viewer";
import Editor from "@monaco-editor/react";

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
  const [promptContent, setPromptContent] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [compareLeft, setCompareLeft] = useState<PromptVersion | null>(null);
  const [compareRight, setCompareRight] = useState<PromptVersion | null>(null);

  // Fetch themes using direct tRPC client
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: () => trpcClient.themes.list.query(),
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["models"],
    queryFn: async (): Promise<ModelConfig[]> => {
      const result = await trpcClient.models.listActive.query();
      return result.map(toModelConfig);
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

  // Fetch user credits
  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  const currentThemeId = existingPrompt?.themeId || selectedTheme;

  const { data: libraryPatterns, isLoading: libraryPatternsLoading } = useQuery({
    queryKey: ["libraryPatterns", currentThemeId],
    queryFn: async () => {
      if (!currentThemeId) return { globalPatterns: [], themePatterns: [] };
      return await trpcClient.admin.libraryPatterns.getByTheme.query({
        themeId: currentThemeId,
      });
    },
    enabled: !!currentThemeId,
  });

  // Fetch prompt versions for history
  const { data: versions } = useQuery({
    queryKey: ["prompt-versions", existingPrompt?.id],
    queryFn: async () => {
      if (!existingPrompt?.id) return [];
      return await trpcClient.prompts.listVersions.query({
        promptId: existingPrompt.id,
      });
    },
    enabled: !!existingPrompt?.id,
  });

  // Initialize prompt content when existing prompt loads
  useEffect(() => {
    if (existingPrompt && !promptContent) {
      setPromptContent(existingPrompt.content);
      setSelectedTheme(existingPrompt.themeId);
    }
  }, [existingPrompt, promptContent]);

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
      window.location.href = `/prompts/${data.promptId}`;
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
    onSuccess: () => {
      toast.success("Prompt updated successfully!");
      window.location.reload();
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

  // Generate content using SSE streaming API
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

    const creditCost = getCreditCostByTier(modelData.tier);
    if (credits && credits.balance < creditCost) {
      toast.error(
        `Insufficient credits. Need ${creditCost}, have ${credits.balance}`,
      );
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

    try {
      // Fetch theme with system prompt
      const themeData = await trpcClient.themes.getById.query({
        id: currentThemeId,
      });

      // Create new prompt first if not exists
      let promptId = existingPrompt?.id;
      if (!promptId) {
        const result = await createPromptMutation.mutateAsync({
          themeId: selectedTheme,
          content: promptContent,
        });
        promptId = result.promptId;
      }

      // Use SSE streaming endpoint
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptId,
          modelKey: selectedModel,
          themeSystemPrompt:
            themeData.systemPrompt ||
            "You are a helpful game generation assistant.",
          promptContent,
          provider: modelData.provider,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Generation failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as {
                type: string;
                code?: string;
                error?: string;
              };

              if (data.type === "chunk" && data.code) {
                setGeneratedCode(data.code);
              } else if (data.type === "complete") {
                setIsGenerating(false);
                toast.success("Game generated successfully!");
              } else if (data.type === "error") {
                throw new Error(data.error || "Generation failed");
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
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
    existingPrompt,
    selectedTheme,
    selectedModel,
    models,
    credits,
    createPromptMutation,
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
    if (existingPrompt) {
      updatePromptMutation.mutate({
        id: existingPrompt.id,
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

  if (promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const isEditing = !!existingPrompt;
  const isForking = !!resolvedSearchParams?.forkId;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {isForking
                  ? "Fork Prompt"
                  : isEditing
                    ? "Edit Prompt"
                    : "Create Prompt"}
              </h1>
              <p className="text-[var(--muted-foreground)] mt-1">
                {isForking
                  ? "Create your own version of this prompt"
                  : "Write a prompt to generate games"}
              </p>
            </div>
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
              {credits && (
                <ArcadeBadge
                  text={`${credits.balance} credits`}
                  variant="default"
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Panel */}
          <div className="lg:col-span-2 space-y-4">
            <ArcadeCard>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Theme Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    {themesLoading ? (
                      <div className="h-10 bg-[var(--muted)] rounded animate-pulse" />
                    ) : (
                      <select
                        id="theme"
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-[var(--background)]"
                      >
                        <option value="">Select a theme</option>
                        {themes?.map((theme: { id: string; title: string }) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Prompt Editor */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <div className="w-full h-[400px] border rounded-md overflow-hidden">
                      <Editor
                        height="400px"
                        defaultLanguage="markdown"
                        value={promptContent}
                        onChange={(value) => setPromptContent(value || "")}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          automaticLayout: true,
                          padding: { top: 10, bottom: 10 },
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4">
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
                  </div>
                </div>
              </div>
            </ArcadeCard>

            {/* Generated Output */}
            {(generatedCode || isGenerating) && (
              <ArcadeCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
                    Generated Game
                  </h3>
                  <StreamingCodeViewer
                    code={generatedCode}
                    language="html"
                    isStreaming={isGenerating}
                    fileName="game.html"
                  />
                </div>
              </ArcadeCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Model Selection */}
            <ArcadeCard>
              <div className="p-6">
                {modelsLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                  </div>
                ) : (
                  <ModelSelector
                    models={models || []}
                    selectedModel={selectedModel}
                    onSelectModel={(modelName) => {
                      if (modelName) {
                        setSelectedModel(modelName);
                      }
                    }}
                  />
                )}
              </div>
            </ArcadeCard>

            {/* Available Libraries */}
            {libraryPatternsLoading ? (
              <ArcadeCard>
                <div className="p-6">
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                  </div>
                </div>
              </ArcadeCard>
            ) : libraryPatterns && (libraryPatterns.globalPatterns.length > 0 || libraryPatterns.themePatterns.length > 0) ? (
              <ArcadeCard>
                <div className="p-6">
                  <h3 className="font-semibold mb-3 text-[var(--foreground)]">
                    Available Libraries for this Theme
                  </h3>
                  <div className="space-y-3">
                    {libraryPatterns.globalPatterns.length > 0 && (
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] mb-2">
                          Global Libraries
                        </p>
                        <div className="space-y-1">
                          {libraryPatterns.globalPatterns.map((pattern) => (
                            <div
                              key={pattern.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-[var(--foreground)]">
                                {pattern.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {libraryPatterns.themePatterns.length > 0 && (
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] mb-2">
                          Theme-Specific Libraries
                        </p>
                        <div className="space-y-1">
                          {libraryPatterns.themePatterns.map((pattern) => (
                            <div
                              key={pattern.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-[var(--foreground)]">
                                {pattern.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ArcadeCard>
            ) : null}

            {/* Version History */}
            {isEditing && versions && versions.length > 0 && (
              <ArcadeCard>
                <div className="p-6">
                  <VersionHistory
                    versions={versions.map(
                      (v: {
                        id: string;
                        version: number;
                        content: string;
                        createdAt: string;
                        authorId: string;
                      }) => ({
                        id: v.id,
                        version: v.version,
                        content: v.content,
                        createdAt: new Date(v.createdAt),
                        author: {
                          id: v.authorId,
                          name: null,
                        },
                      }),
                    )}
                    currentVersion={existingPrompt.version}
                    onCompareVersions={handleCompare}
                  />
                </div>
              </ArcadeCard>
            )}

            {/* Prompt Info */}
            {existingPrompt && (
              <ArcadeCard>
                <div className="p-6">
                  <h3 className="font-semibold mb-3 text-[var(--foreground)]">
                    Prompt Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Version
                      </span>
                      <ArcadeBadge
                        text={`v${existingPrompt.version}`}
                        variant="default"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Tokens
                      </span>
                      <span className="text-[var(--foreground)]">
                        {existingPrompt.tokenCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Visibility
                      </span>
                      <ArcadeBadge
                        text={existingPrompt.visibility}
                        variant="default"
                      />
                    </div>
                    <div className="border-t border-[var(--border)] my-2" />
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Created
                      </span>
                      <span className="text-xs text-[var(--foreground)]">
                        {new Date(existingPrompt.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ArcadeCard>
            )}
          </div>
        </div>
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
