"use client";

import type { ModelSelection } from "@/components/editor/model-types";
import type { ThemeNode, PromptNode, RunNode, FilebrowserSelection } from "./types";
import { ThemeGrid } from "./theme-grid";
import { PromptEditorWithOutput } from "./prompt-editor-with-output";
import { OutputViewer } from "./output-viewer";

interface CenterPanelProps {
  selection: FilebrowserSelection;
  themes: ThemeNode[] | undefined;
  prompts: PromptNode[] | undefined;
  runs: RunNode[] | undefined;
  promptContent: string;
  onPromptContentChange: (content: string) => void;
  gameName: string;
  onGameNameChange: (name: string) => void;
  selectedModels: ModelSelection[];
  onAddModel: (model: ModelSelection) => void;
  onRemoveModel: (id: string) => void;
  activeOutputTab: string | null;
  onOutputTabChange: (id: string) => void;
  versions: Array<{ id: string; version: number; createdAt: string }> | undefined;
  onSelectVersion: (versionId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
  promptsLoading: boolean;
  canEdit: boolean;
  isGenerating: boolean;
}

export function CenterPanel({
  selection,
  themes,
  prompts,
  runs,
  promptContent,
  onPromptContentChange,
  gameName,
  onGameNameChange,
  selectedModels,
  onAddModel,
  onRemoveModel,
  activeOutputTab,
  onOutputTabChange,
  versions,
  onSelectVersion,
  onSelectPrompt,
  onNewPrompt,
  promptsLoading,
  canEdit,
  isGenerating,
}: CenterPanelProps) {
  const theme = themes?.find((t) => t.id === selection.themeId);
  const prompt = prompts?.find((p) => p.id === selection.promptId);
  const run = runs?.find((r) => r.id === selection.runId);

  if (selection.type === "theme" && theme && !selection.promptId) {
    return (
      <ThemeGrid
        themeId={theme.id}
        themeTitle={theme.title}
        prompts={prompts}
        isLoading={promptsLoading}
        selectedPromptId={selection.promptId}
        onSelectPrompt={onSelectPrompt}
        onNewPrompt={onNewPrompt}
      />
    );
  }

  if (selection.type === "prompt" && prompt) {
    return (
      <PromptEditorWithOutput
        promptContent={promptContent}
        onPromptContentChange={onPromptContentChange}
        gameName={gameName}
        onGameNameChange={onGameNameChange}
        selectedModels={selectedModels}
        onAddModel={onAddModel}
        onRemoveModel={onRemoveModel}
        activeOutputTab={activeOutputTab}
        onOutputTabChange={onOutputTabChange}
        visibility={prompt.visibility}
        version={prompt.version}
        versions={versions}
        onSelectVersion={onSelectVersion}
        canEdit={canEdit}
        isGenerating={isGenerating}
      />
    );
  }

  if (selection.type === "new-prompt" && theme) {
    return (
      <PromptEditorWithOutput
        promptContent={promptContent}
        onPromptContentChange={onPromptContentChange}
        gameName={gameName}
        onGameNameChange={onGameNameChange}
        selectedModels={selectedModels}
        onAddModel={onAddModel}
        onRemoveModel={onRemoveModel}
        activeOutputTab={activeOutputTab}
        onOutputTabChange={onOutputTabChange}
        visibility="private"
        version={1}
        versions={undefined}
        onSelectVersion={onSelectVersion}
        canEdit={canEdit}
        isGenerating={isGenerating}
      />
    );
  }

  if (selection.type === "run") {
    return (
      <OutputViewer
        selectedModels={selectedModels}
        activeOutputTab={activeOutputTab}
        onOutputTabChange={onOutputTabChange}
        selectedRun={run}
      />
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-center p-8">
      <div>
        <h2 className="text-lg font-medium mb-2">Welcome to Filebrowser</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Select a theme from the sidebar to get started, or create a new prompt.
        </p>
      </div>
    </div>
  );
}
