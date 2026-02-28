"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, AlertCircle, Loader2 } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection } from "./inbox-types";
import type { Game } from "@/lib/trpc-types";
import { useGenerationById, useGenerationStatus } from "@/stores/generations-store";
import { ModelOutputTab, OutputStatusCard, WaitingState } from "@/components/creator/shared";

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

function EmptyStateCard({ title, description, icon }: EmptyStateCardProps) {
  return (
    <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-2">
        {icon ? <div className="mx-auto w-fit">{icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

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

  const generation = useGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const isComplete = generation?.status === "complete";
  const hasCodeInMemory = !!generation?.code;
  const codeLength = generation?.code.length ?? 0;
  const reasoningLength = generation?.reasoning?.length ?? 0;

  const { data: historicalGameCode, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ["game-raw-code", selectedGameFromHistory?.id],
    queryFn: async () => {
      if (!selectedGameFromHistory?.id) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId: selectedGameFromHistory.id });
      return result.html;
    },
    enabled: !!selectedGameFromHistory?.id,
  });

  const { data: completedGameCode, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["game-raw-code", generation?.gameId],
    queryFn: async () => {
      if (!generation?.gameId) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId: generation.gameId });
      return result.html;
    },
    enabled: !!generation?.gameId && isComplete && !hasCodeInMemory,
  });

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
          <EmptyStateCard
            title="No code available"
            description="This game's code could not be loaded."
          />
        )}
      </div>
    );
  }

  if (selectedModels.length === 0) {
    return (
      <EmptyStateCard
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
              <ModelOutputTabWithStatus
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
        {isLoadingCode ? (
          <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : null}

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
          <OutputStatusCard type="error" error={generation.error} />
        ) : null}

        {!isLoadingCode &&
        !displayCode &&
        !generation?.reasoning &&
        generation?.status !== "error" &&
        generation?.status !== "reasoning" &&
        generation?.status !== "generating" &&
        generation?.status !== "complete" ? (
          <EmptyStateCard
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

function ModelOutputTabWithStatus({
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
    <ModelOutputTab
      modelKey={modelId}
      modelName={modelName}
      status={status}
      isActive={isActive}
      onClick={onSelect}
    />
  );
}
