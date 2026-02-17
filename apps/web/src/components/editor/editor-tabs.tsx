"use client";

import { useRef, useEffect, useState, memo } from "react";
import {
  Code,
  Play,
  History,
  ArrowDown,
  Image,
  Check,
  AlertCircle,
  Brain,
  Sparkles,
} from "lucide-react";
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
import { MediaTabContent } from "./media-tab-content";
import type { ThemeMediaConfig, GameMedia } from "@/lib/trpc-types";
import type { ModelSelection, GenerationStatus } from "./model-types";
import {
  useGenerationById,
  useGenerationStatus,
  type GenerationEntry,
} from "@/stores/generations-store";

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

function GeneratingSkeleton({ status = "generating" }: { status?: GenerationStatus }) {
  const statusText = status === "reasoning" ? "Thinking..." : "Generating your game...";
  const statusSubtext = status === "reasoning" 
    ? "The AI is reasoning through the problem" 
    : "This may take a moment while the AI creates your game";

  return (
    <div className="h-full border border-[var(--border)] rounded-md bg-[var(--card)] p-6 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {status === "reasoning" ? (
          <Brain className="h-12 w-12 text-purple-400 animate-pulse" />
        ) : (
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <div className="text-center space-y-2">
        <p className="text-[var(--foreground)] font-medium">
          {statusText}
        </p>
        <p className="text-[var(--muted-foreground)] text-sm">
          {statusSubtext}
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

function ModelTabIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3.5 w-3.5 animate-pulse text-purple-400" />;
    case "generating":
      return <Sparkles className="h-3.5 w-3.5 animate-spin text-blue-400" />;
    case "complete":
      return <Check className="h-3.5 w-3.5 text-green-400" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
    default:
      return null;
  }
}

/**
 * Model tab button that only re-renders when its specific generation status changes.
 * This is the key optimization - each tab subscribes only to its own generation.
 */
const ModelTabButton = memo(function ModelTabButton({
  modelId,
  modelName,
  isActive,
  onClick,
}: {
  modelId: string;
  modelName: string;
  isActive: boolean;
  onClick: () => void;
}) {
  // Only subscribe to this specific model's status
  const status = useGenerationStatus(modelId) ?? "idle";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap
        ${isActive
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
        }
      `}
    >
      <ModelTabIcon status={status} />
      <span className="truncate max-w-[120px]">{modelName}</span>
    </button>
  );
});

/**
 * Output content component that subscribes to the active generation.
 * Only re-renders when the active generation changes, not when other generations update.
 */
function OutputContent({
  activeOutputTab,
  selectedModels,
  showScrollButton,
  scrollToBottom,
}: {
  activeOutputTab: string | null | undefined;
  selectedModels: ModelSelection[];
  showScrollButton: boolean;
  scrollToBottom: () => void;
}) {
  // Subscribe only to the active generation
  const currentGeneration = useGenerationById(activeOutputTab);
  const currentModel = selectedModels.find((m) => m.id === activeOutputTab);
  const showModelTabs = selectedModels.length > 1;

  if (selectedModels.length === 0) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)] text-sm">
            No models selected.
          </p>
          <p className="text-[var(--muted-foreground)] text-xs mt-1">
            Add models from the sidebar to generate games.
          </p>
        </div>
      </div>
    );
  }

  if (currentGeneration?.code) {
    return (
      <div className="flex-1 min-h-0 relative">
        <StreamingCodeViewer
          code={currentGeneration.code}
          language="html"
          isStreaming={currentGeneration.status === "generating"}
          fileName="game.html"
        />
        {showScrollButton && currentGeneration.status === "generating" && (
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
    );
  }

  if (currentGeneration?.status === "reasoning") {
    return <GeneratingSkeleton status="reasoning" />;
  }

  if (currentGeneration?.status === "generating") {
    return <GeneratingSkeleton status="generating" />;
  }

  if (currentGeneration?.status === "error") {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--destructive)]/10">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-[var(--destructive)] mx-auto mb-2" />
          <p className="text-[var(--foreground)] font-medium">
            Generation failed
          </p>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            {currentGeneration.error ?? "An error occurred during generation"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
      <div className="text-center">
        <p className="text-[var(--muted-foreground)] text-sm">
          {showModelTabs && currentModel
            ? `No output for ${currentModel.modelName} yet.`
            : "No output yet."}
        </p>
        <p className="text-[var(--muted-foreground)] text-xs mt-1">
          Click Generate to create a game.
        </p>
      </div>
    </div>
  );
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Get the active generation's code for auto-scroll detection
  const activeGeneration = useGenerationById(activeOutputTab);
  const generatedCode = activeGeneration?.code ?? "";
  const isGenerating = activeGeneration?.status === "reasoning" || activeGeneration?.status === "generating";

  const showModelTabs = selectedModels.length > 1;

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
        {showMediaTab && themeMediaConfig && (
          <ArcadeTabsTrigger value="media">
            <Image className="h-4 w-4" />
            Media
          </ArcadeTabsTrigger>
        )}
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

      <ArcadeTabsContent value="output" className="flex-1 min-h-0 mt-0 flex flex-col">
        {/* Model sub-tabs - only show when more than 1 model */}
        {showModelTabs && (
          <div className="flex items-center gap-1 pb-2 border-b border-[var(--border)] mb-2 shrink-0 overflow-x-auto">
            {selectedModels.map((model) => (
              <ModelTabButton
                key={model.id}
                modelId={model.id}
                modelName={model.modelName}
                isActive={model.id === activeOutputTab}
                onClick={() => onOutputTabChange?.(model.id)}
              />
            ))}
          </div>
        )}

        {/* Output content - only subscribes to active generation */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 flex flex-col gap-2"
        >
          <OutputContent
            activeOutputTab={activeOutputTab}
            selectedModels={selectedModels}
            showScrollButton={showScrollButton}
            scrollToBottom={scrollToBottom}
          />
        </div>
      </ArcadeTabsContent>

      <ArcadeTabsContent value="history" className="flex-1 min-h-0 mt-0">
        <GenerationsHistory promptId={promptId} />
      </ArcadeTabsContent>

      {showMediaTab && themeMediaConfig && onMediaChange && (
        <ArcadeTabsContent value="media" className="flex-1 min-h-0 mt-0">
          <div className="h-full border border-[var(--border)] rounded-md bg-[var(--card)] overflow-hidden">
            <MediaTabContent
              themeMediaConfig={themeMediaConfig}
              onMediaChange={onMediaChange}
            />
          </div>
        </ArcadeTabsContent>
      )}
    </ArcadeTabs>
  );
}
