"use client";

import { useState, useRef, useCallback, useMemo } from "react";
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
import { Play, Send, Loader2, MoreHorizontal, Trash2, EyeOff, Globe, ArrowDown, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import type { GameListItem, GameStatus } from "@/lib/trpc-types";
import type { GenerationStatus, ModelSelection } from "./types";
import {
  useGenerationById,
  useAllGenerations,
  useGenerationsStore,
} from "@/stores/generations-store";
import { useAutoScroll } from "@/hooks/creator/use-auto-scroll";
import { OutputStatusCard, WaitingState } from "@/components/creator/shared";

interface WorkbenchHistoryTabProps {
  promptId: string | null;
  selectedModels: ModelSelection[];
  activeOutputTab: string | null;
  onOutputTabChange: (id: string | null) => void;
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
  game: GameListItem;
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

interface CompletedGameOutputProps {
  game: GameListItem;
}

function CompletedGameOutput({ game }: CompletedGameOutputProps) {
  const { data: rawCode, isLoading } = useQuery({
    queryKey: ["game-raw-code", game.id],
    queryFn: async () => {
      const result = await trpcClient.games.getRawCode.query({ gameId: game.id });
      return result.html;
    },
    enabled: !!game.id && game.status === "completed",
  });

  if (isLoading) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!rawCode) {
    return (
      <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">{game.name ?? game.modelName ?? "Game"}</p>
          <p className="text-xs text-[var(--muted-foreground)]">Created on {formatDate(game.createdAt)}. No code available.</p>
        </div>
      </div>
    );
  }

  return (
    <StreamingCodeViewerV2
      key={game.id}
      code={rawCode}
      reasoning={undefined}
      language="html"
      isStreaming={false}
      fileName="game.html"
    />
  );
}

export function WorkbenchHistoryTab({
  promptId,
  selectedModels,
  activeOutputTab,
  onOutputTabChange,
  disabled,
}: WorkbenchHistoryTabProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<GameListItem | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [unpublishingGameId, setUnpublishingGameId] = useState<string | null>(null);

  // Output panel scroll state
  const panelRef = useRef<HTMLDivElement>(null);

  // Get current generation state - need to look up by gameId for completed generations
  const generation = useGenerationById(activeOutputTab);
  // Also find generation by gameId if activeOutputTab is a gameId
  const generationByGameId = useGenerationsStore((state) => 
    Object.values(state.generations).find(g => g.gameId === activeOutputTab)
  );
  const activeGeneration = generation ?? generationByGameId;
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    activeGeneration?.status === "reasoning" || activeGeneration?.status === "generating";
  const { showScrollButton, scrollToBottom } = useAutoScroll(panelRef, isStreaming);

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
    const seenGameIds = new Set<string>();

    // Add running and completed generations from store
    for (const gen of allGenerations) {
      if (gen.status !== "idle" && gen.status !== "error") {
        // Track gameId to dedupe with query results
        if (gen.gameId) {
          seenGameIds.add(gen.gameId);
        }

        const model = selectedModels.find((m) => m.id === gen.modelSelectionId);
        // Use gameId as id when complete so it matches activeOutputTab
        items.push({
          type: "running",
          id: gen.status === "complete" && gen.gameId ? gen.gameId : gen.modelSelectionId,
          modelName: model?.modelName ?? gen.modelKey,
          status: gen.status,
        });
      }
    }

    // Add completed games from query, filtering out ones already tracked
    if (games) {
      for (const game of games) {
        if (!seenGameIds.has(game.id)) {
          items.push({ type: "completed", id: game.id, game });
        }
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

  const handleDeleteClick = (game: GameListItem) => {
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

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* History List with inline output */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!promptId && allGenerations.length === 0 ? (
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
                      onClick={() => onOutputTabChange(isExpanded ? null : item.id)}
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
                    {isExpanded && activeGeneration && (
                      <div className="border-t border-[var(--border)] bg-[var(--card)]">
                        <div className="h-[50vh] min-h-[300px] max-h-[60vh] overflow-hidden relative p-1.5" ref={panelRef}>
                          {activeGeneration.code || activeGeneration.reasoning ? (
                            <>
                              <StreamingCodeViewerV2
                                key={activeOutputTab ?? "no-active"}
                                code={activeGeneration.code ?? ""}
                                reasoning={activeGeneration.reasoning}
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
                          ) : activeGeneration.status === "reasoning" ? (
                            <WaitingState status="reasoning" />
                          ) : activeGeneration.status === "generating" ? (
                            <WaitingState status="generating" />
                          ) : activeGeneration.status === "error" ? (
                            <OutputStatusCard type="error" error={activeGeneration.error ?? undefined} />
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
                      onClick={() => onOutputTabChange(isExpanded ? null : game.id)}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[var(--foreground)] truncate">
                            {game.name ?? "Untitled"}
                          </span>
                          {game.isSubmitted && (
                            <Globe className="h-3 w-3 text-green-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--primary)] truncate">
                            {game.modelName ?? "Unknown model"}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {formatDate(game.createdAt)}
                          </span>
                        </div>
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
                        <CompletedGameOutput game={game} />
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
