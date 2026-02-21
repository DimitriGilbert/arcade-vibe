"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Send, Loader2, MoreHorizontal, Trash2, EyeOff, Globe, ArrowDown, AlertCircle, Check, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import type { Game, GameStatus, Visibility } from "@/lib/trpc-types";
import type { GenerationStatus, ModelSelection } from "./types";
import {
  useGenerationById,
  useGenerationStatus,
  useAllGenerations,
} from "@/stores/generations-store";

interface WorkbenchHistoryTabProps {
  promptId: string | null;
  selectedModels: ModelSelection[];
  activeOutputTab: string | null;
  onOutputTabChange: (id: string) => void;
  disabled: boolean;
}

// Combined item type for history list (running generations and completed games)
interface RunningGenerationItem {
  type: "running";
  id: string;
  modelName: string;
  status: GenerationStatus;
}

interface CompletedGameItem {
  type: "completed";
  id: string;
  game: Game;
}

type HistoryItem = RunningGenerationItem | CompletedGameItem;

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status: GameStatus): "default" | "neon" {
  if (status === "completed") return "neon";
  return "default";
}

// Output display components
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
      className={`h-full min-h-0 rounded-lg border ${toneClass} flex items-center justify-center p-4`}
    >
      <div className="max-w-sm text-center space-y-2">
        {icon ? <div className="mx-auto w-fit">{icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function WaitingState({ status }: { status: "reasoning" | "generating" }) {
  return (
    <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
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
        "group inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
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

export function WorkbenchHistoryTab({
  promptId,
  selectedModels,
  activeOutputTab,
  onOutputTabChange,
  disabled,
}: WorkbenchHistoryTabProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [unpublishingGameId, setUnpublishingGameId] = useState<string | null>(null);

  // Output panel scroll state
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Get current generation state
  const generation = useGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const codeLength = generation?.code.length ?? 0;
  const reasoningLength = generation?.reasoning?.length ?? 0;

  // Get all running generations
  const allGenerations = useAllGenerations();

  // Fetch games for history
  const { data: games, isLoading, error } = useQuery({
    queryKey: ["games-by-prompt", promptId],
    queryFn: async () => {
      if (!promptId) return [];
      const result = await trpcClient.games.listByPrompt.query({ promptId });
      return result ?? [];
    },
    enabled: !!promptId,
  });

  // Build combined history items: running generations + completed games
  const historyItems = useMemo((): HistoryItem[] => {
    const items: HistoryItem[] = [];

    // Add running generations first (not completed, not error, not idle)
    for (const gen of allGenerations) {
      if (gen.status !== "idle" && gen.status !== "complete" && gen.status !== "error") {
        const model = selectedModels.find((m) => m.id === gen.modelSelectionId);
        items.push({
          type: "running",
          id: gen.modelSelectionId,
          modelName: model?.modelName ?? gen.modelKey,
          status: gen.status,
        });
      }
    }

    // Add completed games
    if (games) {
      for (const game of games) {
        items.push({
          type: "completed",
          id: game.id,
          game,
        });
      }
    }

    return items;
  }, [allGenerations, selectedModels, games]);

  // Mutations
  const submitMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await trpcClient.games.submit.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game submitted!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (gameId: string) => {
      setUnpublishingGameId(gameId);
      return await trpcClient.games.unpublish.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game unpublished!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      setUnpublishingGameId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unpublish");
      setUnpublishingGameId(null);
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async (gameId: string) => {
      setDeletingGameId(gameId);
      return await trpcClient.games.hardDelete.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game deleted!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      setDeleteDialogOpen(false);
      setGameToDelete(null);
      setDeletingGameId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete");
      setDeletingGameId(null);
    },
  });

  const handleDeleteClick = (game: Game) => {
    setGameToDelete(game);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (gameToDelete) {
      hardDeleteMutation.mutate(gameToDelete.id);
    }
  };

  const handleUnpublish = (gameId: string) => {
    unpublishMutation.mutate(gameId);
  };

  // Scroll handling for output
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
  }, [getScrollElement]);

  useEffect(() => {
    if (isStreaming) {
      isAutoScrollingRef.current = true;
      setShowScrollButton(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    if (!isAutoScrollingRef.current) return;

    const scroller = getScrollElement();
    if (scroller && isAutoScrollingRef.current) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [isStreaming, getScrollElement]);

  const scrollToBottom = () => {
    const scroller = getScrollElement();
    if (!scroller) return;

    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    userScrollIntentRef.current = false;
    isAutoScrollingRef.current = true;
    setShowScrollButton(false);
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* History List with inline output */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!promptId ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-[var(--muted-foreground)] text-sm text-center">
              Save your prompt to view generation history
            </p>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-[var(--muted-foreground)] text-sm text-center">Failed to load history</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-[var(--muted-foreground)] text-sm text-center">
              No generations yet. Generate a game to see history.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {historyItems.map((item) => {
              const isExpanded = item.id === activeOutputTab;

              if (item.type === "running") {
                return (
                  <li key={`running-${item.id}`}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 hover:bg-[var(--muted)]/20 transition-colors text-left"
                      onClick={() => onOutputTabChange(isExpanded ? "" : item.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-[var(--foreground)] truncate font-medium">
                            {item.modelName}
                          </span>
                          <span className="text-[10px] text-[var(--primary)]">Generating...</span>
                        </div>
                        <ArcadeBadge text={item.status} variant="default" className="animate-pulse" />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === "reasoning" ? (
                          <Brain className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                        )}
                      </div>
                    </button>
                    {isExpanded && generation && (
                      <div className="border-t border-[var(--border)] bg-[var(--card)]">
                        <div className="h-[50vh] min-h-[300px] max-h-[60vh] overflow-hidden relative p-1.5" ref={panelRef}>
                          {generation.code || generation.reasoning ? (
                            <>
                              <StreamingCodeViewerV2
                                key={activeOutputTab ?? "no-active"}
                                code={generation.code ?? ""}
                                reasoning={generation.reasoning}
                                language="html"
                                isStreaming={isStreaming}
                                fileName="game.html"
                              />
                              {showScrollButton && isStreaming && (
                                <ArcadeButton
                                  variant="outline"
                                  size="sm"
                                  onClick={scrollToBottom}
                                  className="absolute bottom-3 right-3 shadow-md"
                                >
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  Follow
                                </ArcadeButton>
                              )}
                            </>
                          ) : generation.status === "reasoning" ? (
                            <WaitingState status="reasoning" />
                          ) : generation.status === "generating" ? (
                            <WaitingState status="generating" />
                          ) : generation.status === "error" ? (
                            <OutputStatusCard
                              tone="error"
                              icon={<AlertCircle className="h-6 w-6 text-[var(--destructive)]" />}
                              title="Generation failed"
                              description={generation.error ?? "An error occurred"}
                            />
                          ) : null}
                        </div>
                      </div>
                    )}
                  </li>
                );
              }

              // Completed game item
              const game = item.game;
              const canSubmit = game.status === "completed" && !game.isSubmitted;
              const isSubmitting = submitMutation.isPending && submitMutation.variables === game.id;
              const isUnpublishing = unpublishingGameId === game.id;
              const isDeleting = deletingGameId === game.id;

              return (
                <li key={`game-${game.id}`}>
                  <div className="flex items-center justify-between p-2.5 hover:bg-[var(--muted)]/20 transition-colors group">
                    <button
                      type="button"
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      onClick={() => onOutputTabChange(isExpanded ? "" : game.id)}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[var(--foreground)] truncate">
                            {(game.name || game.modelName) ?? "Unknown"}
                          </span>
                          {game.isSubmitted && (
                            <Globe className="h-3 w-3 text-green-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {formatDate(game.createdAt)}
                        </span>
                      </div>
                      <ArcadeBadge text={game.status} variant={getStatusVariant(game.status)} />
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArcadeButton
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/game/${game.id}`, "_blank")}
                      >
                        <Play className="h-3 w-3" />
                      </ArcadeButton>
                      {canSubmit && (
                        <ArcadeButton
                          size="sm"
                          onClick={() => submitMutation.mutate(game.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </ArcadeButton>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--muted)] focus:opacity-100"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          {game.isSubmitted && (
                            <DropdownMenuItem
                              onClick={() => handleUnpublish(game.id)}
                              disabled={isUnpublishing}
                            >
                              <EyeOff className="h-3.5 w-3.5 mr-2" />
                              {isUnpublishing ? "Unpublishing..." : "Unpublish"}
                            </DropdownMenuItem>
                          )}
                          {game.isSubmitted && <DropdownMenuSeparator />}
                          {!game.isSubmitted && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(game)}
                              disabled={isDeleting}
                              variant="destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] bg-[var(--card)]">
                      <div className="h-[50vh] min-h-[300px] max-h-[60vh] overflow-hidden relative p-1.5">
                        <OutputStatusCard
                          title={game.name ?? game.modelName ?? "Game"}
                          description={`Created on ${formatDate(game.createdAt)}. Click Play to view.`}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{gameToDelete?.name || gameToDelete?.modelName || "this game"}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
