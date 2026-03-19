"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Loader2, PanelRightOpen } from "lucide-react";
import { useIDEState } from "./use-ide-state";
import { ExplorerSidebar } from "./explorer-sidebar";
import { EditorArea } from "./editor-area";
import { ConfigPanel } from "./config-panel";
import { StatusBar, countWords } from "./status-bar";
import { ContextMenu } from "./context-menu";
import { ConfirmDialog } from "./confirm-dialog";
import { DiscoveryDialog } from "@/components/creator/shared";
import { FeedbackButton } from "@/components/feedback";
import { editorFeedbackSchema, editorFeedbackFields } from "@/lib/feedback-schemas";
import { useGeneration } from "@/hooks/creator/use-generation";
import { trpcClient } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import type { Visibility, ModelSelection, IDETab } from "./types";

function IDESkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="relative flex-1 min-h-0 flex">
        <aside className="w-64 border-r border-border bg-sidebar shrink-0">
          <div className="h-10 border-b border-border" />
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-muted/50 animate-pulse rounded" />
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-background">
          <div className="h-10 border-b border-border" />
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 bg-muted/50 animate-pulse rounded"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>
        </main>

        <aside className="w-80 border-l border-border bg-card shrink-0">
          <div className="h-10 border-b border-border" />
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-muted/50 animate-pulse rounded" />
                <div className="h-8 bg-muted/50 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="h-6 border-t border-border bg-muted" />
    </div>
  );
}

interface ForkBannerProps {
  originalPromptId: string;
  onClearFork: () => void;
  onFork: () => void;
  isForkPending: boolean;
}

function ForkBanner({ originalPromptId, onClearFork, onFork, isForkPending }: ForkBannerProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
      <span className="text-primary">
        Viewing prompt in read-only mode
      </span>
      <button
        type="button"
        onClick={onFork}
        disabled={isForkPending}
        className="flex items-center gap-1.5 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
      >
        {isForkPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {isForkPending ? "Forking..." : "Fork this prompt to edit"}
      </button>
    </div>
  );
}

interface IDELayoutProps {
  urlPromptId?: string;
  urlForkId?: string;
}

const MIN_EXPLORER_WIDTH = 240;
const MAX_EXPLORER_WIDTH = 520;
const DEFAULT_EXPLORER_WIDTH = 320;
const MIN_CONFIG_WIDTH = 280;
const MAX_CONFIG_WIDTH = 520;
const DEFAULT_CONFIG_WIDTH = 320;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function IDELayout({ urlPromptId, urlForkId }: IDELayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState(DEFAULT_EXPLORER_WIDTH);
  const [configWidth, setConfigWidth] = useState(DEFAULT_CONFIG_WIDTH);
  const resizeStateRef = useRef<{
    panel: "explorer" | "config";
    startX: number;
    startWidth: number;
  } | null>(null);
  const state = useIDEState({ urlPromptId, urlForkId });
  const queryClient = useQueryClient();

  const {
    selection,
    setSelection,
    expandedThemes,
    setExpandedThemes,
    expandedPrompts,
    setExpandedPrompts,
    promptContent,
    setPromptContent,
    promptTitle,
    setPromptTitle,
    gameName,
    setGameName,
    originalContent,
    originalTitle,
    originalVisibility,
    visibility,
    setVisibility,
    isDirty,
    isNewPrompt,
    selectedModels,
    setSelectedModels,
    configPanelCollapsed,
    setConfigPanelCollapsed,
    contextMenu,
    showContextMenu,
    hideContextMenu,
    confirmDialog,
    showConfirmDialog,
    hideConfirmDialog,
    themesLoading,
    promptsLoading,
    gamesLoading,
    generationError,
    clearGenerationError,
    cursorPosition,
    setCursorPosition,
    themes,
    prompts,
    games,
    gamesByPromptId,
    gamesLoadingByPromptId,
    handleSelectTheme,
    handleSelectPrompt,
    handleSelectGame,
    handleNewPrompt,
    handleSave,
    handleDiscardNewPrompt,
    switchToTab,
    setGameTabViewMode,
    updateGameTabPublishedState,
    closeGameTab,
    openPromptTabs,
    handleToggleThemeExpand,
    handleTogglePromptExpand,
    currentPromptId,
    isForking,
    forkOriginalPromptId,
    clearFork,
  } = state;

  const addGenerationTabs = useCallback((models: ModelSelection[]) => {
    setSelection((prev) => {
      const existingTabIds = new Set(prev.openTabs.map((t) => t.id));
      const newTabs: IDETab[] = models
        .filter((m) => !existingTabIds.has(m.id))
        .map((m) => ({
          id: m.id,
          type: "game" as const,
          label: m.modelName,
          modelKey: m.id,
          modelName: m.modelName,
          isSubmitted: false,
          viewMode: "game" as const,
        }));
      
      if (newTabs.length === 0) return prev;
      
      return {
        ...prev,
        openTabs: [...prev.openTabs, ...newTabs],
        activeTabId: newTabs[0]?.id ?? prev.activeTabId,
      };
    });
  }, [setSelection]);

  const updateGenerationTabId = useCallback((modelId: string, gameId: string) => {
    setSelection((prev) => {
    const tabIndex = prev.openTabs.findIndex((t) => t.id === gameId);
    if (tabIndex !== -1) return prev;
    
    const targetIndex = prev.openTabs.findIndex((t) => t.id === modelId);
    if (targetIndex === -1) return prev;
    
    const newTabs = [...prev.openTabs];
    const existingTab = newTabs[targetIndex];
    if (!existingTab) return prev;
    
    newTabs[targetIndex] = {
      ...existingTab,
      id: gameId,
      label: existingTab.label,
    };
    
    const newActiveTabId = prev.activeTabId === modelId ? gameId : prev.activeTabId;
    
    return {
      ...prev,
      openTabs: newTabs,
      activeTabId: newActiveTabId,
    };
  });
  }, [setSelection]);

  const {
    isGenerating,
    handleGenerate,
    discoveryDialog,
    completedCount,
  } = useGeneration({
    promptContent,
    gameName,
    selectedTheme: selection.themeId,
    selectedModels,
    existingPromptId: currentPromptId,
    visibility,
    onPromptCreated: (promptId) => {
      void handleSelectPrompt(promptId, {
        preserveSelectedModels: true,
        preserveGameName: true,
      });
    },
    onGenerationStart: addGenerationTabs,
    onGenerationComplete: (gameId, modelId) => {
      updateGenerationTabId(modelId, gameId);
    },
  });

  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  const { data: versions } = useQuery({
    queryKey: ["prompt-versions", currentPromptId],
    queryFn: async () => {
      if (!currentPromptId) return [];
      return await trpcClient.prompts.listVersions.query({ promptId: currentPromptId });
    },
    enabled: !!currentPromptId,
  });

  const forkPromptMutation = useMutation({
    mutationFn: async (input: { forkId: string }) => {
      const result = await trpcClient.prompts.fork.mutate({
        promptId: input.forkId,
        visibility: "private" as Visibility,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt forked!");
      window.location.href = `/creator/ide?promptId=${data.promptId}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      return await trpcClient.prompts.update.mutate({
        id: input.id,
        content: promptContent,
        title: input.title,
        tokenizer: "gpt-4",
      });
    },
    onSuccess: () => {
      toast.success("Prompt title updated!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update prompt");
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.prompts.softDelete.mutate({ id: input.id });
    },
    onSuccess: (data) => {
      toast.success("Prompt deleted!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
      if (currentPromptId === data.promptId) {
        handleNewPrompt();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete prompt");
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      return await trpcClient.games.update.mutate({
        gameId: input.id,
        name: input.name,
      });
    },
    onSuccess: () => {
      toast.success("Game name updated!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update game");
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.games.softDelete.mutate({ gameId: input.id });
    },
    onSuccess: () => {
      toast.success("Game deleted!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete game");
    },
  });

  const toggleGamePublishedMutation = useMutation({
    mutationFn: async (input: { id: string; isSubmitted: boolean }) => {
      if (input.isSubmitted) {
        return await trpcClient.games.submit.mutate({ gameId: input.id });
      } else {
        return await trpcClient.games.unpublish.mutate({ gameId: input.id });
      }
    },
    onSuccess: (_data, variables) => {
      updateGameTabPublishedState(variables.id, variables.isSubmitted);
      toast.success("Game visibility updated!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["game", variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update game visibility");
    },
  });

  const handleModelToggle = useCallback((model: ModelSelection) => {
    setSelectedModels((prev) => {
      if (prev.some((m) => m.modelKey === model.modelKey)) {
        return prev;
      }
      return [...prev, model];
    });
  }, [setSelectedModels]);

  const handleModelRemove = useCallback((modelId: string) => {
    setSelectedModels((prev) => prev.filter((m) => m.id !== modelId));
  }, [setSelectedModels]);

  const handleCollapseAll = useCallback(() => {
    setExpandedThemes([]);
    setExpandedPrompts([]);
  }, [setExpandedThemes, setExpandedPrompts]);

  const handleExpandAll = useCallback(() => {
    if (themes) {
      setExpandedThemes(themes.map((t) => t.id));
    }
    if (prompts) {
      setExpandedPrompts(prompts.map((p) => p.id));
    }
  }, [themes, prompts, setExpandedThemes, setExpandedPrompts]);

  const handleFork = useCallback(() => {
    if (forkOriginalPromptId) {
      forkPromptMutation.mutate({ forkId: forkOriginalPromptId });
    }
  }, [forkOriginalPromptId, forkPromptMutation]);

  const handleSelectVersion = useCallback(async (versionId: string) => {
    const versionData = versions?.find((v) => v.id === versionId);
    if (versionData) {
      setPromptContent(versionData.content);
    }
  }, [versions, setPromptContent]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      if (resizeState.panel === "explorer") {
        const nextWidth = clamp(
          resizeState.startWidth + (event.clientX - resizeState.startX),
          MIN_EXPLORER_WIDTH,
          MAX_EXPLORER_WIDTH
        );
        setExplorerWidth(nextWidth);
        return;
      }

      const nextWidth = clamp(
        resizeState.startWidth - (event.clientX - resizeState.startX),
        MIN_CONFIG_WIDTH,
        MAX_CONFIG_WIDTH
      );
      setConfigWidth(nextWidth);
    };

    const handlePointerUp = () => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const startResize = useCallback((panel: "explorer" | "config", event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStateRef.current = {
      panel,
      startX: event.clientX,
      startWidth: panel === "explorer" ? explorerWidth : configWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [configWidth, explorerWidth]);

  const canGenerate = !!promptTitle.trim() && promptTitle.trim().length >= 3 && !!promptContent.trim() && selectedModels.length > 0 && !!selection.themeId && !isForking;

  const activeTab = selection.openTabs.find((t) => t.id === selection.activeTabId);
  const activeTabType = activeTab?.type ?? "prompt";
  const wordCount = promptContent ? countWords(promptContent) : 0;
  const totalModels = selectedModels.length;

  if (!mounted) {
    return <IDESkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {isForking && forkOriginalPromptId && (
        <ForkBanner
          originalPromptId={forkOriginalPromptId}
          onClearFork={clearFork}
          onFork={handleFork}
          isForkPending={forkPromptMutation.isPending}
        />
      )}

      <div className="relative flex-1 min-h-0 flex">
        <aside
          style={{ width: `${explorerWidth}px` }}
          className="h-full shrink-0 border-r border-border bg-sidebar"
        >
          <ExplorerSidebar
            themes={themes ?? []}
            selection={selection}
            expandedThemes={expandedThemes}
            expandedPrompts={expandedPrompts}
            themesLoading={themesLoading}
            isGenerating={isGenerating}
            isDirty={isDirty}
            isNewPrompt={isNewPrompt}
            promptTitle={promptTitle}
            prompts={prompts}
            promptsLoading={promptsLoading}
            games={games}
            gamesLoading={gamesLoading}
            gamesByPromptId={gamesByPromptId}
            gamesLoadingByPromptId={gamesLoadingByPromptId}
            onSelectTheme={handleSelectTheme}
            onSelectPrompt={handleSelectPrompt}
            onSelectGame={handleSelectGame}
            onNewPrompt={handleNewPrompt}
            onSave={handleSave}
            onDiscardNewPrompt={handleDiscardNewPrompt}
            onPromptTitleChange={setPromptTitle}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            toggleThemeExpanded={handleToggleThemeExpand}
            togglePromptExpanded={handleTogglePromptExpand}
            showContextMenu={showContextMenu}
            showConfirmDialog={showConfirmDialog}
            updatePromptMutation={updatePromptMutation}
            deletePromptMutation={deletePromptMutation}
            updateGameMutation={updateGameMutation}
            deleteGameMutation={deleteGameMutation}
            toggleGamePublishedMutation={toggleGamePublishedMutation}
          />
        </aside>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize explorer sidebar"
          onPointerDown={(event) => startResize("explorer", event)}
          className="w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-[var(--border)]"
        />
        <EditorArea
          selection={selection}
          promptContent={promptContent}
          setPromptContent={setPromptContent}
          isDirty={isDirty}
          isGenerating={isGenerating}
          isForking={isForking}
          onSwitchToTab={switchToTab}
          onCloseGameTab={closeGameTab}
          onSave={handleSave}
          onCursorChange={setCursorPosition}
          onGameTabViewModeChange={setGameTabViewMode}
          onToggleGamePublish={(gameId, isSubmitted) =>
            toggleGamePublishedMutation.mutate({ id: gameId, isSubmitted })
          }
          isPublishingGame={toggleGamePublishedMutation.isPending}
        />
        {!configPanelCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize config panel"
            onPointerDown={(event) => startResize("config", event)}
            className="w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-[var(--border)]"
          />
        )}
        <ConfigPanel
          collapsed={configPanelCollapsed}
          onCollapse={setConfigPanelCollapsed}
          width={configWidth}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          gameName={gameName}
          setGameName={setGameName}
          selectedModels={selectedModels}
          onModelToggle={handleModelToggle}
          onModelRemove={handleModelRemove}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
          credits={credits}
          versions={versions}
          onSelectVersion={handleSelectVersion}
          selection={selection}
        />
        {configPanelCollapsed ? (
          <button
            type="button"
            onClick={() => setConfigPanelCollapsed(false)}
            className="absolute right-0 top-2 z-30 inline-flex items-center gap-2 rounded-l-md border border-r-0 border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-md transition-colors hover:bg-[var(--muted)]"
            aria-label="Expand config panel"
            title="Expand config panel"
          >
            <PanelRightOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>Config</span>
          </button>
        ) : null}
      </div>

      <StatusBar
        credits={credits}
        isGenerating={isGenerating}
        completedCount={completedCount}
        totalModels={totalModels}
        cursorLine={cursorPosition.line}
        cursorColumn={cursorPosition.column}
        wordCount={wordCount}
        activeTabType={activeTabType}
      />

      {contextMenu.open && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={hideContextMenu}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) hideConfirmDialog();
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />

      <DiscoveryDialog {...discoveryDialog.dialogProps} />

      <div className="fixed bottom-4 right-4 z-50">
        <FeedbackButton
          schema={editorFeedbackSchema}
          fields={editorFeedbackFields}
          subject="IDE Feedback"
          label="Feedback"
          variant="outline"
          description="Help us improve the IDE experience."
        />
      </div>
    </div>
  );
}
