"use client";

import { useState } from "react";
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
import { History, Play, Send, Loader2, MoreHorizontal, Trash2, EyeOff, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Game, GameStatus } from "@/lib/trpc-types";

interface GenerationsHistoryProps {
  promptId: string | null;
}

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

export function GenerationsHistory({ promptId }: GenerationsHistoryProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [unpublishingGameId, setUnpublishingGameId] = useState<string | null>(null);

  const {
    data: games,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["games-by-prompt", promptId],
    queryFn: async () => {
      if (!promptId) return [];
      const result = await trpcClient.games.listByPrompt.query({ promptId });
      return result ?? [];
    },
    enabled: !!promptId,
  });

  const submitMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await trpcClient.games.submit.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game submitted successfully!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
      void queryClient.invalidateQueries({ queryKey: ["games-initial"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit game");
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
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
      setUnpublishingGameId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unpublish game");
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
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
      setDeleteDialogOpen(false);
      setGameToDelete(null);
      setDeletingGameId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete game");
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

  if (!promptId) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <p className="text-[var(--muted-foreground)] text-sm">
          Select or create a prompt to view generation history.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <p className="text-[var(--muted-foreground)] text-sm">
          Failed to load generation history.
        </p>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <p className="text-[var(--muted-foreground)] text-sm">
          No generations yet. Generate a game to see history.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md overflow-y-auto bg-[var(--muted)]/10">
        <ul className="divide-y divide-[var(--border)]">
          {games.map((game: Game) => {
            const canSubmit = game.status === "completed" && !game.isSubmitted;
            const isSubmitting =
              submitMutation.isPending && submitMutation.variables === game.id;
            const isUnpublishing = unpublishingGameId === game.id;
            const isDeleting = deletingGameId === game.id;

            return (
              <li
                key={game.id}
                className="flex items-center justify-between p-3 hover:bg-[var(--muted)]/20 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--foreground)] truncate">
                        {(game.name || game.modelName) ?? "Unknown model"}
                      </span>
                      {game.isSubmitted && (
                        <Globe className="h-3 w-3 text-green-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(game.createdAt)}
                    </span>
                  </div>
                  <ArcadeBadge
                    text={game.status}
                    variant={getStatusVariant(game.status)}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ArcadeButton
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/game/${game.id}`, "_blank")}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </ArcadeButton>
                  {canSubmit && (
                    <ArcadeButton
                      size="sm"
                      onClick={() => submitMutation.mutate(game.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          Submit
                        </>
                      )}
                    </ArcadeButton>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--muted)] focus:opacity-100"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      {game.isSubmitted && (
                        <DropdownMenuItem
                          onClick={() => handleUnpublish(game.id)}
                          disabled={isUnpublishing}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
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
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{gameToDelete?.name || gameToDelete?.modelName || "this game"}"? This action cannot be undone.
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
    </>
  );
}
