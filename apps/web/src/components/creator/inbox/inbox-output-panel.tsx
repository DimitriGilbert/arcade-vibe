"use client";

import { memo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, AlertCircle, Check, Sparkles, Brain, Loader2 } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection, GenerationStatus } from "./inbox-types";
import type { Game } from "@/lib/trpc-types";
import { useGenerationById, useGenerationStatus } from "@/stores/generations-store";

interface GenerationEntry {
  modelSelectionId: string;
  modelKey: string;
  status: GenerationStatus;
  code: string;
  reasoning?: string;
  gameId: string | null;
  error?: string;
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
      className={`h-full min-h-0 rounded-xl border ${toneClass} flex items-center justify-center p-4`}
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
    <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        {status === "reasoning" ? (
          <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
        ) : (
          <Sparkles className="h-5 w-5 text-cyan-400 animate-spin" />
        )}
        <span className="text-sm text-[var(--muted-foreground)]">
          {status === "reasoning" ? "Waiting for reasoning..." : "Waiting for code..."}
        </span>
      </div>
    </div>
  );
}

function ModelStatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3.5 w-3.5 text-blue-400 animate-pulse" />;
    case "generating":
      return <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />;
    case "complete":
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-[var(--destructive)]" />;
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
  const status = useGenerationStatus(modelId) ?? "idle";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60",
      ].join(" ")}
    >
      <ModelStatusIcon status={status} />
      <span className="truncate max-w-[10rem]">{modelName}</span>
    </button>
  );
});

export interface InboxOutputPanelProps {
  activeOutputTab: string | null | undefined;
  selectedModels: ModelSelection[];
  onOutputTabChange?: (id: string) => void;
  selectedGameFromHistory?: Game | null;
}

export function InboxOutputPanel({
  activeOutputTab,
  selectedModels,
  onOutputTabChange,
  selectedGameFromHistory,
}: InboxOutputPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Use Zustand hooks directly for reactive updates
  const generation = useGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const isComplete = generation?.status === "complete";
  const hasCodeInMemory = !!generation?.code;
  const codeLength = generation?.code.length ?? 0;
  const reasoningLength = generation?.reasoning?.length ?? 0;

  // Fetch game code if viewing a historical game (use raw code without SDK template)
  const { data: historicalGameCode, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ["game-raw-code", selectedGameFromHistory?.id],
    queryFn: async () => {
      if (!selectedGameFromHistory?.id) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId: selectedGameFromHistory.id });
      return result.html;
    },
    enabled: !!selectedGameFromHistory?.id,
  });

  // Fetch raw code for completed generations that don't have code in memory
  // (e.g., after page reload or when navigating back to a completed generation)
  const { data: completedGameCode, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["game-raw-code", generation?.gameId],
    queryFn: async () => {
      if (!generation?.gameId) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId: generation.gameId });
      return result.html;
    },
    enabled: !!generation?.gameId && isComplete && !hasCodeInMemory,
  });

  // Determine what code to show
  // Priority: history game > completed game from API > in-memory code
  const displayCode = selectedGameFromHistory
    ? (historicalGameCode ?? "")
    : isComplete && !hasCodeInMemory
      ? (completedGameCode ?? "")
      : (generation?.code ?? "");
  const displayReasoning = selectedGameFromHistory || (isComplete && !hasCodeInMemory)
    ? undefined
    : generation?.reasoning;
  const isViewingHistory = !!selectedGameFromHistory;
  const isLoadingCode = isLoadingHistorical || (isComplete && !hasCodeInMemory && isLoadingCompleted);

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
    scroller.addEventListener("touchstart", markUserScrollIntent, {
      passive: true,
    });
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

  // If viewing a historical game (even without models selected), show the code
  if (selectedGameFromHistory) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        {isLoadingHistorical ? (
          <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : historicalGameCode ? (
          <div className="h-full min-h-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5">
            <StreamingCodeViewerV2
              key={selectedGameFromHistory.id}
              code={historicalGameCode}
              reasoning={undefined}
              language="html"
              isStreaming={false}
              fileName="game.html"
            />
          </div>
        ) : (
          <OutputStatusCard
            title="No code available"
            description="This game's code could not be loaded."
          />
        )}
      </div>
    );
  }

  if (selectedModels.length === 0) {
    return (
      <OutputStatusCard
        title="No models selected"
        description="Pick models from the selector above to start generating."
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 overflow-hidden">
      {hasMultipleModels ? (
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {selectedModels.map((model) => (
              <ModelOutputTab
                key={model.id}
                modelId={model.id}
                modelName={model.modelName}
                isActive={model.id === activeOutputTab}
                onSelect={() => onOutputTabChange?.(model.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 h-0 min-h-0 overflow-hidden" ref={panelRef}>
        {/* Loading state for completed games being fetched */}
        {isLoadingCode ? (
          <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : null}

        {/* Current generation view - streaming or completed with code in memory */}
        {!isLoadingCode && displayCode ? (
          <div className="h-full min-h-0 overflow-hidden relative rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5">
            <div className="h-full min-h-0 flex flex-col gap-2">
              <div className="flex-1 h-0 min-h-0">
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

            {showScrollButton && isStreaming ? (
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 shadow-md"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Follow
              </ArcadeButton>
            ) : null}
          </div>
        ) : null}

        {!isLoadingCode && generation?.status === "reasoning" && !generation?.reasoning && !generation?.code ? (
          <WaitingState status="reasoning" />
        ) : null}

        {!isLoadingCode && generation?.status === "generating" && !generation?.code ? (
          <WaitingState status="generating" />
        ) : null}

        {!isLoadingCode && generation?.status === "error" ? (
          <OutputStatusCard
            tone="error"
            icon={<AlertCircle className="h-8 w-8 text-[var(--destructive)]" />}
            title="Generation failed"
            description={generation.error ?? "An unknown error occurred."}
          />
        ) : null}

        {!isLoadingCode &&
        !displayCode &&
        !generation?.reasoning &&
        generation?.status !== "error" &&
        generation?.status !== "reasoning" &&
        generation?.status !== "generating" &&
        generation?.status !== "complete" ? (
          <OutputStatusCard
            title={
              currentModel
                ? `Ready for ${currentModel.modelName}`
                : "Ready"
            }
            description="Click Generate to create your game."
          />
        ) : null}
      </div>
    </div>
  );
}
