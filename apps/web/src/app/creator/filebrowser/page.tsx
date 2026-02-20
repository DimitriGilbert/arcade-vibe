"use client";

import { useCallback } from "react";
import type { FilebrowserSelection } from "@/components/creator/filebrowser";
import { FeedbackButton } from "@/components/feedback";
import { Loader2 } from "lucide-react";
import {
  FileTree,
  HeaderBar,
  CenterPanel,
  useFilebrowserState,
} from "@/components/creator/filebrowser";
import { editorFeedbackSchema, editorFeedbackFields } from "@/lib/feedback-schemas";

export default function FilebrowserPage() {
  const state = useFilebrowserState();

  const {
    mounted,
    promptContent,
    setPromptContent,
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
  } = state;

  const handleSelectTheme = useCallback((themeId: string) => {
    setSelection({
      type: "theme",
      themeId,
      promptId: null,
      runId: null,
    });
  }, [setSelection]);

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
  }, [themes, setSelection]);

  const handlePlayGame = useCallback(() => {
    if (activeGameId) {
      window.open(`/game/${activeGameId}`, "_blank");
    }
  }, [activeGameId]);

  const handleOutputTabChange = useCallback((id: string) => {
    setActiveOutputTab(id);
    // When selecting a model tab, switch to prompt view if we're on a run
    if (selection.type === "run") {
      setSelection((prev) => ({
        ...prev,
        type: "prompt",
        runId: null,
      }));
    }
  }, [setActiveOutputTab, selection.type, setSelection]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const canGenerate = !!promptContent.trim() && selectedModels.length > 0 && !!selection.themeId;
  const canSave = !!promptContent.trim() && !!selection.themeId;
  const hasActiveGame = !!activeGameId;

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
        onNewPrompt={handleNewPrompt}
        onSave={handleSave}
        onGenerate={handleGenerate}
        onPlayGame={handlePlayGame}
        onHome={handleHome}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left sidebar - File tree */}
        <aside className="w-64 lg:w-72 border-r border-[var(--border)] bg-[var(--card)] shrink-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="px-3 py-2 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                Explorer
              </h2>
            </div>
            <div className="flex-1 min-h-0">
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
            </div>
          </div>
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
            onNewPrompt={handleNewPrompt}
            promptsLoading={promptsLoading}
            canEdit={!isGenerating}
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
    </div>
  );
}
