"use client";

import { memo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, AlertCircle, Check, Sparkles, Brain, ExternalLink, Loader2 } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { trpcClient } from "@/utils/trpc";
import type { CodelabOutput } from "./types";
import type { GenerationStatus } from "@/components/editor/model-types";

interface CodelabOutputCellProps {
  outputs: Record<string, CodelabOutput>;
  activeOutputTab: string | null;
  onOutputTabChange: (id: string) => void;
  onPlayGame?: (gameId: string) => void;
}

function OutputStatusCard({
  title,
  description,
  tone = "neutral",
  icon,
}: {
  title: string;
  description: string;
  tone?: "neutral" | "error";
  icon?: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-[var(--destructive)]/40 bg-[var(--destructive)]/10"
      : "border-[var(--border)] bg-[var(--muted)]/10";

  return (
    <div
      className={`h-full min-h-[200px] rounded-lg border ${toneClass} flex items-center justify-center p-4`}
    >
      <div className="max-w-md text-center space-y-2">
        {icon ? <div className="mx-auto w-fit">{icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function WaitingState({ status }: { status: "reasoning" | "generating" }) {
  return (
    <div className="h-full min-h-[200px] rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        {status === "reasoning" ? (
          <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
        ) : (
          <Sparkles className="h-5 w-5 text-cyan-400 animate-spin" />
        )}
        <span className="text-sm text-[var(--muted-foreground)]">
          {status === "reasoning" ? "Thinking..." : "Generating code..."}
        </span>
      </div>
    </div>
  );
}

function ModelStatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3 w-3 text-blue-400 animate-pulse" />;
    case "generating":
      return <Sparkles className="h-3 w-3 text-cyan-400 animate-spin" />;
    case "complete":
      return <Check className="h-3 w-3 text-emerald-400" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-[var(--destructive)]" />;
    default:
      return null;
  }
}

const ModelOutputTab = memo(function ModelOutputTab({
  modelId,
  modelName,
  isActive,
  onSelect,
}: {
  modelId: string;
  modelName: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const output = window.__codelabOutputs?.[modelId];
  const status: GenerationStatus = output?.status ?? "idle";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60",
      ].join(" ")}
    >
      <ModelStatusIcon status={status} />
      <span className="truncate max-w-[8rem]">{modelName}</span>
    </button>
  );
});

// Global type for output access from memo components
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { __codelabOutputs?: Record<string, CodelabOutput | undefined>; }
}

export function CodelabOutputCell({
  outputs,
  activeOutputTab,
  onOutputTabChange,
  onPlayGame,
}: CodelabOutputCellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const outputIds = Object.keys(outputs);
  const hasMultipleModels = outputIds.length > 1;

  // Update global reference for memo components
  useEffect(() => {
    window.__codelabOutputs = outputs;
  }, [outputs]);

  const currentOutput = activeOutputTab ? outputs[activeOutputTab] : undefined;
  const currentModelName = currentOutput?.modelName ?? "Unknown";
  const isStreaming =
    currentOutput?.status === "reasoning" || currentOutput?.status === "generating";
  const isComplete = currentOutput?.status === "complete";
  const hasCodeInMemory = !!currentOutput?.code;
  const codeLength = currentOutput?.code.length ?? 0;
  const reasoningLength = currentOutput?.reasoning?.length ?? 0;
  const activeGameId = currentOutput?.gameId;

  // Fetch raw code for completed outputs that don't have code in memory
  const { data: completedGameCode, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["game-raw-code", activeGameId],
    queryFn: async () => {
      if (!activeGameId) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId: activeGameId });
      return result.html;
    },
    enabled: !!activeGameId && isComplete && !hasCodeInMemory,
  });

  // Determine what code to show
  const displayCode = isComplete && !hasCodeInMemory
    ? (completedGameCode ?? "")
    : (currentOutput?.code ?? "");
  const displayReasoning = isComplete && !hasCodeInMemory
    ? undefined
    : currentOutput?.reasoning;
  const isLoadingCode = isComplete && !hasCodeInMemory && isLoadingCompleted;

  const getScrollElement = useCallback((): HTMLElement | null => {
    const root = panelRef.current;
    if (!root) return null;
    const scroller = root.querySelector(".streaming-code-viewer__scroll");
    return scroller instanceof HTMLElement ? scroller : null;
  }, []);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    const markUserScrollIntent = () => {
      userScrollIntentRef.current = true;
    };

    const onScroll = () => {
      const isNearBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 32;
      if (isAutoScrollingRef.current && userScrollIntentRef.current && !isNearBottom) {
        isAutoScrollingRef.current = false;
      }
      setShowScrollButton(!isNearBottom);
      if (isNearBottom) {
        userScrollIntentRef.current = false;
      }
    };

    scroller.addEventListener("wheel", markUserScrollIntent, { passive: true });
    scroller.addEventListener("touchstart", markUserScrollIntent, { passive: true });
    scroller.addEventListener("mousedown", markUserScrollIntent);
    scroller.addEventListener("scroll", onScroll);
    return () => {
      scroller.removeEventListener("wheel", markUserScrollIntent);
      scroller.removeEventListener("touchstart", markUserScrollIntent);
      scroller.removeEventListener("mousedown", markUserScrollIntent);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [getScrollElement]);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;
    scroller.scrollLeft = 0;
  }, [activeOutputTab, getScrollElement]);

  useEffect(() => {
    if (isStreaming) {
      isAutoScrollingRef.current = true;
      setShowScrollButton(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    if (!isAutoScrollingRef.current) return;

    const frameId = requestAnimationFrame(() => {
      const scroller = getScrollElement();
      if (scroller && isAutoScrollingRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isStreaming, codeLength, reasoningLength, getScrollElement]);

  const scrollToBottom = () => {
    const scroller = getScrollElement();
    if (!scroller) return;

    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    userScrollIntentRef.current = false;
    isAutoScrollingRef.current = true;
    setShowScrollButton(false);
  };

  if (outputIds.length === 0) {
    return (
      <OutputStatusCard
        title="No models selected"
        description="Pick models to generate output"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-hidden">
      {/* Model Tabs */}
      {hasMultipleModels && (
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {outputIds.map((id) => {
              const output = outputs[id];
              if (!output) return null;
              return (
                <ModelOutputTab
                  key={id}
                  modelId={id}
                  modelName={output.modelName}
                  isActive={id === activeOutputTab}
                  onSelect={() => onOutputTabChange(id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Output Content */}
      <div className="flex-1 min-h-0 overflow-hidden" ref={panelRef}>
        {/* Loading state for completed games being fetched */}
        {isLoadingCode ? (
          <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : null}

        {/* Code display - streaming or completed */}
        {!isLoadingCode && displayCode ? (
          <div className="h-full min-h-0 overflow-hidden relative rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="h-full min-h-0 flex flex-col">
              <div className="flex-1 min-h-0">
                <StreamingCodeViewerV2
                  key={activeOutputTab ?? "no-active-output-tab"}
                  code={displayCode}
                  reasoning={displayReasoning}
                  language="html"
                  isStreaming={isStreaming}
                  fileName="game.html"
                />
              </div>
            </div>

            {/* Follow Stream Button */}
            {showScrollButton && isStreaming && (
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 shadow-md"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Follow
              </ArcadeButton>
            )}
          </div>
        ) : null}

        {/* Waiting States */}
        {!isLoadingCode && currentOutput?.status === "reasoning" && !currentOutput?.reasoning && !currentOutput?.code && (
          <WaitingState status="reasoning" />
        )}

        {!isLoadingCode && currentOutput?.status === "generating" && !currentOutput?.code && (
          <WaitingState status="generating" />
        )}

        {/* Error State */}
        {!isLoadingCode && currentOutput?.status === "error" && (
          <OutputStatusCard
            tone="error"
            icon={<AlertCircle className="h-8 w-8 text-[var(--destructive)]" />}
            title="Generation failed"
            description={currentOutput.error ?? "An unknown error occurred"}
          />
        )}

        {/* Idle State */}
        {!isLoadingCode &&
          !displayCode &&
          !currentOutput?.reasoning &&
          currentOutput?.status !== "error" &&
          currentOutput?.status !== "reasoning" &&
          currentOutput?.status !== "generating" &&
          currentOutput?.status !== "complete" && (
            <OutputStatusCard
              title={`No output for ${currentModelName}`}
              description="Run generation to see code"
            />
          )}
      </div>

      {/* Play Game Button */}
      {activeGameId && !isStreaming && onPlayGame && (
        <div className="shrink-0 pt-2">
          <ArcadeButton
            variant="glow"
            onClick={() => onPlayGame(activeGameId)}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Play Game
          </ArcadeButton>
        </div>
      )}
    </div>
  );
}
