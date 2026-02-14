"use client";

import { useRef, useEffect, useState } from "react";
import { Code, Play, History, ExternalLink, ArrowDown } from "lucide-react";
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

// Loading skeleton component for the waiting state
function GeneratingSkeleton() {
  return (
    <div className="h-full border border-[var(--border)] rounded-md bg-[var(--card)] p-6 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-[var(--foreground)] font-medium">
          Generating your game...
        </p>
        <p className="text-[var(--muted-foreground)] text-sm">
          This may take a moment while the AI creates your game
        </p>
      </div>
      <div className="flex gap-1 mt-2">
        <div
          className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Handle scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isAutoScrolling) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isAutoScrolling]);

  // Auto-scroll when new code arrives during generation
  useEffect(() => {
    if (
      isGenerating &&
      isAutoScrolling &&
      generatedCode &&
      scrollContainerRef.current
    ) {
      // Find the actual scroll container inside StreamingCodeViewer
      const container = scrollContainerRef.current.querySelector(
        ".streaming-code-viewer__scroll",
      );
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [generatedCode, isGenerating, isAutoScrolling]);

  const scrollToBottom = () => {
    const container = scrollContainerRef.current?.querySelector(
      ".streaming-code-viewer__scroll",
    );
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
      setIsAutoScrolling(true);
      setShowScrollButton(false);
    }
  };

  // Reset auto-scroll when generation starts
  useEffect(() => {
    if (isGenerating) {
      setIsAutoScrolling(true);
      setShowScrollButton(false);
    }
  }, [isGenerating]);

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
        <div
          ref={scrollContainerRef}
          className="h-full flex flex-col gap-2 p-1"
        >
          {generatedCode ? (
            <>
              <div className="flex-1 min-h-0 relative">
                <StreamingCodeViewer
                  code={generatedCode}
                  language="html"
                  isStreaming={isGenerating}
                  fileName="game.html"
                />
                {/* Scroll to bottom button */}
                {showScrollButton && isGenerating && (
                  <ArcadeButton
                    variant="outline"
                    size="sm"
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 shadow-lg z-10"
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Scroll to Bottom
                  </ArcadeButton>
                )}
              </div>
              {generatedGameId && !isGenerating && (
                <div className="shrink-0 flex justify-end">
                  <ArcadeButton
                    variant="glow"
                    size="sm"
                    onClick={() =>
                      window.open(`/game/${generatedGameId}`, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Play Game
                  </ArcadeButton>
                </div>
              )}
            </>
          ) : isGenerating ? (
            <GeneratingSkeleton />
          ) : (
            <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10 p-6">
              <p className="text-[var(--muted-foreground)] text-sm text-center">
                No output yet. Generate a game to see results.
              </p>
            </div>
          )}
        </div>
      </ArcadeTabsContent>

      <ArcadeTabsContent value="history" className="flex-1 min-h-0 mt-0">
        <GenerationsHistory promptId={promptId} />
      </ArcadeTabsContent>
    </ArcadeTabs>
  );
}
