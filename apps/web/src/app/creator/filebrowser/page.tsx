"use client";

import { useCallback, useEffect, use } from "react";
import { Copy, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FilebrowserSelection } from "@/components/creator/filebrowser";
import { FeedbackButton } from "@/components/feedback";
import {
  FileTree,
  HeaderBar,
  CenterPanel,
  useFilebrowserState,
} from "@/components/creator/filebrowser";
import { DiscoveryDialog } from "@/components/creator/shared";
import { editorFeedbackSchema, editorFeedbackFields } from "@/lib/feedback-schemas";
import { ArcadeButton } from "@/components/arcade";

interface FilebrowserPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

export default function FilebrowserPage({ searchParams }: FilebrowserPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined })
  );

  const state = useFilebrowserState({
    promptId: resolvedSearchParams?.promptId,
    forkId: resolvedSearchParams?.forkId,
  });

  const {
    mounted,
    promptContent,
    setPromptContent,
    promptTitle,
    setPromptTitle,
    gameName,
    setGameName,
    selectedModels,
    isGenerating,
    selection,
    setSelection,
    expandedThemes,
    expandedPrompts,
    themes,
    themesLoading,
    prompts,
    promptsLoading,
    promptLoading,
    runs,
    runsLoading,
    runsByPromptId,
    runsLoadingByPromptId,
    credits,
    versions,
    activeOutputTab,
    setActiveOutputTab,
    completedCount,
    activeGameId,
    handleAddModel,
    handleRemoveModel,
    handleGenerate,
    handleSave,
    handleNewPrompt,
    handleSelectPrompt,
    handleSelectVersion,
    handleToggleThemeExpand,
    handleTogglePromptExpand,
    clearGenerations,
    discoveryDialog,
    isForking,
    handleFork,
    isForkPending,
    handleSubmitGame,
    handleUnpublishGame,
    handleDeleteGame,
    submittingGameId,
    unpublishingGameId,
    deletingGameId,
  } = state;

  // Update URL when prompt is selected
  useEffect(() => {
    if (selection.promptId && selection.promptId !== resolvedSearchParams?.promptId) {
      const url = new URL(window.location.href);
      url.searchParams.set("promptId", selection.promptId);
      url.searchParams.delete("forkId");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, [selection.promptId, resolvedSearchParams?.promptId]);

  const handleSelectTheme = useCallback((themeId: string) => {
    setSelection({
      type: "theme",
      themeId,
      promptId: null,
      runId: null,
    });
    clearGenerations();
  }, [setSelection, clearGenerations]);

  const handleSelectRun = useCallback((runId: string) => {
    setSelection((prev) => ({
      ...prev,
      type: "run",
      runId,
    }));
  }, [setSelection]);

  const handleHome = useCallback(() => {
    const firstActiveTheme = themes?.find((t) => t.isActive);
    setSelection({
      type: firstActiveTheme ? "theme" : null,
      themeId: firstActiveTheme?.id ?? null,
      promptId: null,
      runId: null,
    });
    const url = new URL(window.location.href);
    url.searchParams.delete("promptId");
    url.searchParams.delete("forkId");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [themes, setSelection]);

  const handlePlayGame = useCallback(() => {
    if (activeGameId) {
      window.open(`/game/${activeGameId}`, "_blank");
    }
  }, [activeGameId]);

  const handleOutputTabChange = useCallback((id: string) => {
    setActiveOutputTab(id);
    if (selection.type === "run") {
      setSelection((prev) => ({
        ...prev,
        type: "prompt",
        runId: null,
      }));
    }
  }, [setActiveOutputTab, selection.type, setSelection]);

  // Handle new prompt - clear URL params
  const handleNewPromptWithUrl = useCallback(() => {
    handleNewPrompt();
    const url = new URL(window.location.href);
    url.searchParams.delete("promptId");
    url.searchParams.delete("forkId");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [handleNewPrompt]);

  if (!mounted || promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const canGenerate = !!promptTitle.trim() && promptTitle.trim().length >= 3 && !!promptContent.trim() && selectedModels.length > 0 && !!selection.themeId && !isForking;
  const canSave = !!promptTitle.trim() && promptTitle.trim().length >= 3 && !!promptContent.trim() && !!selection.themeId && !isForking;
  const hasActiveGame = !!activeGameId;

  const selectedRun = selection.runId ? runs?.find((r) => r.id === selection.runId) : undefined;

  return (
    <div className="min-h-screen h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <HeaderBar
        selection={selection}
        themes={themes}
        prompts={prompts}
        runs={runs}
        credits={credits}
        isGenerating={isGenerating}
        canGenerate={canGenerate}
        canSave={canSave}
        hasActiveGame={hasActiveGame}
        completedCount={completedCount}
        totalModels={selectedModels.length}
        promptTitle={promptTitle}
        onPromptTitleChange={setPromptTitle}
        onNewPrompt={handleNewPromptWithUrl}
        onSave={handleSave}
        onGenerate={handleGenerate}
        onPlayGame={handlePlayGame}
        onHome={handleHome}
      />

      {/* Fork Banner */}
      {isForking && (
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/20 flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Viewing prompt in read-only mode
          </span>
          <ArcadeButton
            size="sm"
            onClick={handleFork}
            disabled={isForkPending}
          >
            {isForkPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {isForkPending ? "Forking..." : "Fork this prompt to edit"}
          </ArcadeButton>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 flex">
        {/* Left sidebar - File tree */}
        <aside className="h-full w-64 lg:w-72 border-r border-[var(--border)] bg-[var(--card)] shrink-0 flex flex-col">
          <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                Explorer
              </h2>
              <button
                type="button"
                title="New Prompt"
                onClick={handleNewPromptWithUrl}
                className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <FileTree
                themes={themes}
                themesLoading={themesLoading}
                prompts={prompts}
                promptsLoading={promptsLoading}
                runs={runs}
                runsLoading={runsLoading}
                runsByPromptId={runsByPromptId}
                runsLoadingByPromptId={runsLoadingByPromptId}
                expandedThemes={expandedThemes}
                expandedPrompts={expandedPrompts}
                selectedThemeId={selection.themeId}
                selectedPromptId={selection.promptId}
                selectedRunId={selection.runId}
                onToggleTheme={handleToggleThemeExpand}
                onTogglePrompt={handleTogglePromptExpand}
                onSelectTheme={handleSelectTheme}
                onSelectPrompt={handleSelectPrompt}
                onSelectRun={handleSelectRun}
              />
            </ScrollArea>
        </aside>

        {/* Center panel */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <CenterPanel
            selection={selection}
            themes={themes}
            prompts={prompts}
            runs={runs}
            promptContent={promptContent}
            onPromptContentChange={setPromptContent}
            gameName={gameName}
            onGameNameChange={setGameName}
            selectedModels={selectedModels}
            onAddModel={handleAddModel}
            onRemoveModel={handleRemoveModel}
            activeOutputTab={activeOutputTab}
            onOutputTabChange={handleOutputTabChange}
            versions={versions}
            onSelectVersion={handleSelectVersion}
            onSelectPrompt={handleSelectPrompt}
            onNewPrompt={handleNewPromptWithUrl}
            promptsLoading={promptsLoading}
            canEdit={!isGenerating && !isForking}
            isGenerating={isGenerating}
            selectedRun={selectedRun}
            onSubmitGame={handleSubmitGame}
            onUnpublishGame={handleUnpublishGame}
            onDeleteGame={handleDeleteGame}
            submittingGameId={submittingGameId}
            unpublishingGameId={unpublishingGameId}
            deletingGameId={deletingGameId}
          />
        </main>
      </div>

      {/* Floating Feedback Button */}
      <div className="absolute bottom-4 right-4 z-50">
        <FeedbackButton
          schema={editorFeedbackSchema}
          fields={editorFeedbackFields}
          subject="File Browser Editor Feedback"
          label="Feedback"
          variant="outline"
          description="Help us improve the File Browser editor. Share your thoughts on the layout and features."
        />
      </div>

      <DiscoveryDialog {...discoveryDialog.dialogProps} />
    </div>
  );
}
