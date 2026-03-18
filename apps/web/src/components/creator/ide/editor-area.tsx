"use client";

import { EditorTabs } from "./editor-tabs";
import { PromptContent } from "./prompt-content";
import { GameContent } from "./game-content";
import type { IDESelection, IDETab } from "./types";

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
}: EditorAreaProps) {
  const { openTabs, activeTabId } = selection;

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
          />
        ) : activeTab?.type === "game" ? (
          <GameContent 
            gameId={activeTabId} 
            modelKey={activeTab.modelKey} 
            modelName={activeTab.modelName}
            title={activeTab.label}
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
