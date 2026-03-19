"use client";

import { useState } from "react";
import { EditorTabs } from "./editor-tabs";
import { PromptContent } from "./prompt-content";
import { GameContent } from "./game-content";
import type { EditorTheme, IDESelection, IDETab } from "./types";
import type { CreatorGuidanceState } from "./creator-guidance";

export interface EditorAreaProps {
  selection: IDESelection;
  promptContent: string;
  setPromptContent: (content: string) => void;
  isDirty: boolean;
  isGenerating: boolean;
  isForking: boolean;
  onSwitchToTab: (tabId: string) => void;
  onCloseGameTab: (gameId: string) => void;
  onSave: () => void;
  onCursorChange: (line: number, column: number) => void;
  onGameTabViewModeChange: (gameId: string, viewMode: "game" | "code") => void;
  onToggleGamePublish: (gameId: string, isSubmitted: boolean) => void;
  isPublishingGame: boolean;
  guidance: CreatorGuidanceState | null;
  onDismissGuidance: () => void;
}

export function EditorArea({
  selection,
  promptContent,
  setPromptContent,
  isDirty,
  isGenerating,
  isForking,
  onSwitchToTab,
  onCloseGameTab,
  onSave,
  onCursorChange,
  onGameTabViewModeChange,
  onToggleGamePublish,
  isPublishingGame,
  guidance,
  onDismissGuidance,
}: EditorAreaProps) {
  const { openTabs, activeTabId } = selection;
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("github-dark");

  const activeTab = openTabs.find((tab: IDETab) => tab.id === activeTabId);

  return (
    <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      <EditorTabs
        tabs={openTabs}
        activeTabId={activeTabId}
        onTabClick={onSwitchToTab}
        onTabClose={onCloseGameTab}
        isDirty={isDirty}
        onSave={onSave}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab?.type === "prompt" ? (
          <PromptContent
            content={promptContent}
            onChange={setPromptContent}
            readOnly={isGenerating || isForking}
            onCursorChange={onCursorChange}
            theme={editorTheme}
            guidance={guidance}
            onDismissGuidance={onDismissGuidance}
          />
        ) : activeTab?.type === "game" ? (
          <GameContent 
            gameId={activeTabId} 
            modelKey={activeTab.modelKey} 
            modelName={activeTab.modelName}
            title={activeTab.label}
            gameStatus={activeTab.gameStatus}
            isSubmitted={activeTab.isSubmitted}
            viewMode={activeTab.viewMode ?? "game"}
            theme={editorTheme}
            onThemeChange={setEditorTheme}
            onViewModeChange={(viewMode) => onGameTabViewModeChange(activeTabId, viewMode)}
            onTogglePublish={onToggleGamePublish}
            isPublishing={isPublishingGame}
            guidance={guidance}
            onDismissGuidance={onDismissGuidance}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a tab to view content
          </div>
        )}
      </div>
    </main>
  );
}
