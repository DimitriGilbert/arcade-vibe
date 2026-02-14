"use client";

import { Code, Play, History, ExternalLink } from "lucide-react";
import Editor from "@monaco-editor/react";
import {
  ArcadeTabs,
  ArcadeTabsList,
  ArcadeTabsTrigger,
  ArcadeTabsContent,
  ArcadeButton,
} from "@/components/arcade";
import { StreamingCodeViewer } from "@/components/streaming-code-viewer";
import { GenerationsHistory } from "./generations-history";

export interface EditorTabsProps {
  promptContent: string;
  onPromptChange: (content: string) => void;
  generatedCode: string;
  isGenerating: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  promptId: string | null;
  generatedGameId?: string | null;
}

export function EditorTabs({
  promptContent,
  onPromptChange,
  generatedCode,
  isGenerating,
  activeTab,
  onTabChange,
  promptId,
  generatedGameId,
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
        {generatedCode ? (
          <div className="h-full flex flex-col gap-2">
            <div className="flex-1 min-h-0">
              <StreamingCodeViewer
                code={generatedCode}
                language="html"
                isStreaming={isGenerating}
                fileName="game.html"
              />
            </div>
            {generatedGameId && !isGenerating && (
              <div className="shrink-0 flex justify-end">
                <ArcadeButton
                  variant="glow"
                  size="sm"
                  onClick={() => window.open(`/game/${generatedGameId}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Play Game
                </ArcadeButton>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
            <p className="text-[var(--muted-foreground)] text-sm">
              No output yet. Generate a game to see results.
            </p>
          </div>
        )}
      </ArcadeTabsContent>

      <ArcadeTabsContent value="history" className="flex-1 min-h-0 mt-0">
        <GenerationsHistory promptId={promptId} />
      </ArcadeTabsContent>
    </ArcadeTabs>
  );
}
