"use client";

import { Code, Play, History, Image } from "lucide-react";
import Editor from "@monaco-editor/react";
import {
  ArcadeTabs,
  ArcadeTabsList,
  ArcadeTabsTrigger,
  ArcadeTabsContent,
} from "@/components/arcade";
import { GenerationsHistory } from "./generations-history";
import { MediaTabContent } from "./media-tab-content";
import { EditorOutputPanel } from "./editor-output-panel";
import type { ThemeMediaConfig, GameMedia } from "@/lib/trpc-types";
import type { ModelSelection } from "./model-types";

export interface EditorTabsProps {
  promptContent: string;
  onPromptChange: (content: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  promptId: string | null;
  themeMediaConfig?: ThemeMediaConfig;
  showMediaTab?: boolean;
  onMediaChange?: (media: GameMedia) => void;
  selectedModels?: ModelSelection[];
  activeOutputTab?: string | null;
  onOutputTabChange?: (id: string) => void;
}

export function EditorTabs({
  promptContent,
  onPromptChange,
  activeTab,
  onTabChange,
  promptId,
  themeMediaConfig,
  showMediaTab,
  onMediaChange,
  selectedModels = [],
  activeOutputTab,
  onOutputTabChange,
}: EditorTabsProps) {
  return (
    <ArcadeTabs
      value={activeTab}
      onValueChange={onTabChange}
      className="h-full flex flex-col"
    >
      <ArcadeTabsList className="shrink-0">
        <ArcadeTabsTrigger value="editor">
          <Code className="h-4 w-4" />
          Editor
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger value="output">
          <Play className="h-4 w-4" />
          Output
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger value="history">
          <History className="h-4 w-4" />
          History
        </ArcadeTabsTrigger>
        {showMediaTab && themeMediaConfig ? (
          <ArcadeTabsTrigger value="media">
            <Image className="h-4 w-4" />
            Media
          </ArcadeTabsTrigger>
        ) : null}
      </ArcadeTabsList>

      <ArcadeTabsContent value="editor" className="flex-1 min-h-0 mt-0">
        <div className="h-full border border-[var(--border)] rounded-md overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={promptContent}
            onChange={(value) => onPromptChange(value ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              wordWrap: "on",
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 10, bottom: 10 },
            }}
          />
        </div>
      </ArcadeTabsContent>

      <ArcadeTabsContent value="output" className="flex-1 min-h-0 mt-0">
        <EditorOutputPanel
          activeOutputTab={activeOutputTab}
          selectedModels={selectedModels}
          onOutputTabChange={onOutputTabChange}
        />
      </ArcadeTabsContent>

      <ArcadeTabsContent value="history" className="flex-1 min-h-0 mt-0">
        <GenerationsHistory promptId={promptId} />
      </ArcadeTabsContent>

      {showMediaTab && themeMediaConfig && onMediaChange ? (
        <ArcadeTabsContent value="media" className="flex-1 min-h-0 mt-0">
          <div className="h-full border border-[var(--border)] rounded-md bg-[var(--card)] overflow-hidden">
            <MediaTabContent
              themeMediaConfig={themeMediaConfig}
              onMediaChange={onMediaChange}
            />
          </div>
        </ArcadeTabsContent>
      ) : null}
    </ArcadeTabs>
  );
}
