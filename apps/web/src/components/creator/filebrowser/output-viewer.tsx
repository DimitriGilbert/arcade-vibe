"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Loader2, Send, EyeOff, Trash2, Globe, Play } from "lucide-react";
import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection } from "@/lib/model-types";
import { useGenerationById, useGenerationStatus } from "@/stores/generations-store";
import type { RunNode } from "./types";
import { ModelOutputTab, OutputStatusCard, WaitingState } from "@/components/creator/shared";
import { GameActionsDropdown } from "@/components/creator/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ModelOutputTabWithStatus({
  modelKey,
  modelName,
  isActive,
  onClick,
}: {
  modelKey: string;
  modelName: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const status = useGenerationStatus(modelKey) ?? "idle";
  return (
    <ModelOutputTab
      modelKey={modelKey}
      modelName={modelName}
      status={status}
      isActive={isActive}
      onClick={onClick}
    />
  );
}

interface OutputViewerProps {
  selectedModels: ModelSelection[];
  activeOutputTab: string | null;
  onOutputTabChange: (id: string) => void;
  selectedRun: RunNode | undefined;
  onSubmitGame?: (gameId: string) => void;
  onUnpublishGame?: (gameId: string) => void;
  onDeleteGame?: (gameId: string) => void;
  submittingGameId?: string | null;
  unpublishingGameId?: string | null;
  deletingGameId?: string | null;
}

export function OutputViewer({
  selectedModels,
  activeOutputTab,
  onOutputTabChange,
  selectedRun,
  onSubmitGame,
  onUnpublishGame,
  onDeleteGame,
  submittingGameId,
  unpublishingGameId,
  deletingGameId,
}: OutputViewerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<RunNode | null>(null);

  const generation = useGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const isComplete = generation?.status === "complete";
  const hasCodeInMemory = !!generation?.code;
  const codeLength = generation?.code.length ?? 0;
  const reasoningLength = generation?.reasoning?.length ?? 0;

  // Fetch raw code for completed generations that don't have code in memory
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
  const displayCode = isComplete && !hasCodeInMemory
    ? (completedGameCode ?? "")
    : (generation?.code ?? "");
  const displayReasoning = isComplete && !hasCodeInMemory
    ? undefined
    : generation?.reasoning;
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

  // Fetch raw code for selected run from history
  const { data: historicalRunCode, isLoading: isLoadingHistoricalRun } = useQuery({
    queryKey: ["game-raw-code", selectedRun?.gameId],
    queryFn: async () => {
      if (!selectedRun?.gameId) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId: selectedRun.gameId });
      return result.html;
    },
    enabled: !!selectedRun?.gameId && selectedModels.length === 0,
  });

  const handleDeleteClick = useCallback((run: RunNode) => {
    setGameToDelete(run);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (gameToDelete && onDeleteGame) {
      onDeleteGame(gameToDelete.id);
      setDeleteDialogOpen(false);
      setGameToDelete(null);
    }
  }, [gameToDelete, onDeleteGame]);

  // If we have a selected run from history with no models, show that game's code
  if (selectedRun && selectedRun.gameId && selectedModels.length === 0) {
    const canSubmit = selectedRun.status === "completed" && !selectedRun.isSubmitted;
    const isSubmitting = submittingGameId === selectedRun.id;
    const isUnpublishing = unpublishingGameId === selectedRun.id;
    const isDeleting = deletingGameId === selectedRun.id;

    return (
      <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedRun.name ?? selectedRun.modelName}</span>
              {selectedRun.isSubmitted && (
                <Globe className="h-3 w-3 text-green-500" />
              )}
              <ArcadeBadge
                text={selectedRun.status}
                variant={selectedRun.status === "completed" ? "neon" : "default"}
                className="text-[10px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArcadeButton
                variant="glow"
                size="sm"
                onClick={() => {
                  if (selectedRun.gameId) {
                    window.open(`/game/${selectedRun.gameId}`, "_blank");
                  }
                }}
              >
                <Play className="h-3 w-3 mr-1.5" />
                Play Game
              </ArcadeButton>
              {canSubmit && onSubmitGame && (
                <ArcadeButton
                  size="sm"
                  onClick={() => onSubmitGame(selectedRun.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Submit
                </ArcadeButton>
              )}
              {selectedRun.isSubmitted && onUnpublishGame && (
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={() => onUnpublishGame(selectedRun.id)}
                  disabled={isUnpublishing}
                >
                  {isUnpublishing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  Unpublish
                </ArcadeButton>
              )}
              {!selectedRun.isSubmitted && onDeleteGame && (
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(selectedRun)}
                  disabled={isDeleting}
                  className="text-[var(--destructive)]"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete
                </ArcadeButton>
              )}
            </div>
          </div>
        </div>
        {isLoadingHistoricalRun ? (
          <div className="flex-1 min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : historicalRunCode ? (
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <StreamingCodeViewerV2
              key={selectedRun.gameId}
              code={historicalRunCode}
              reasoning={undefined}
              language="html"
              isStreaming={false}
              fileName="game.html"
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center p-4">
            <p className="text-sm text-[var(--muted-foreground)]">No code available</p>
          </div>
        )}
        
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Game</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this game? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <ArcadeButton
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </ArcadeButton>
              <ArcadeButton
                onClick={handleConfirmDelete}
                disabled={deletingGameId === gameToDelete?.id}
                className="bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
              >
                {deletingGameId === gameToDelete?.id ? "Deleting..." : "Delete"}
              </ArcadeButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (selectedModels.length === 0) {
    return (
      <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">No model selected</p>
          <p className="text-xs text-[var(--muted-foreground)]">Select models to generate or view run history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
      {hasMultipleModels ? (
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {selectedModels.map((model) => (
              <ModelOutputTabWithStatus
                key={model.id}
                modelKey={model.id}
                modelName={model.modelName}
                isActive={model.id === activeOutputTab}
                onClick={() => onOutputTabChange(model.id)}
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

        {/* Code display - streaming or completed */}
        {!isLoadingCode && displayCode ? (
          <div className="h-full min-h-0 overflow-hidden relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
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
                Follow stream
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
          <OutputStatusCard type="error" error={generation.error ?? "An unknown error occurred during generation."} />
        ) : null}

        {!isLoadingCode &&
        !displayCode &&
        !generation?.reasoning &&
        generation?.status !== "error" &&
        generation?.status !== "reasoning" &&
        generation?.status !== "generating" &&
        generation?.status !== "complete" ? (
          <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {currentModel ? `No output yet for ${currentModel.modelName}` : "No output yet"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">Run generation to see code stream here.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
