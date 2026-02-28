"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Send, Loader2, Check, AlertCircle, Sparkles, ChevronLeft, ChevronRight, EyeOff, Globe, GitBranch, Plus, Scale } from "lucide-react";
import { toast } from "sonner";
import type { Game, GameStatus, PromptVersion } from "@/lib/trpc-types";
import { GameActionsDropdown, VersionComparisonDialog } from "@/components/creator/shared";

interface InboxGenerationHistoryProps {
  promptId: string | null;
  onSelectGame?: (game: Game) => void;
  selectedGameId?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  versions?: PromptVersion[];
  currentVersion?: number | null;
  selectedVersionId?: string | null;
  onSelectVersion?: (versionId: string) => void;
  onNewVersion?: () => void;
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

function getStatusIcon(status: GameStatus): React.ReactNode {
  switch (status) {
    case "generating":
      return <Sparkles className="h-3 w-3 animate-spin text-blue-400" />;
    case "completed":
      return <Check className="h-3 w-3 text-green-400" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    case "hidden":
      return <EyeOff className="h-3 w-3 text-[var(--muted-foreground)]" />;
    default:
      return null;
  }
}

function getStatusVariant(status: GameStatus): "default" | "neon" {
  if (status === "completed") return "neon";
  return "default";
}

function getVersionVariant(
  v: PromptVersion,
  currentVersion: number | null | undefined,
  selectedVersionId: string | null | undefined,
): "neon" | "pixel" | "default" {
  if (v.version === currentVersion) return "neon";
  if (v.id === selectedVersionId) return "pixel";
  return "default";
}

export function InboxGenerationHistory({ 
  promptId, 
  onSelectGame, 
  selectedGameId,
  isCollapsed = false,
  onToggleCollapse,
  versions,
  currentVersion,
  selectedVersionId,
  onSelectVersion,
  onNewVersion,
}: InboxGenerationHistoryProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [unpublishingGameId, setUnpublishingGameId] = useState<string | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const { data: games, isLoading, error } = useQuery({
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
      toast.success("Game submitted!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
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

  if (isCollapsed) {
    return (
      <div className="h-full w-[28px] bg-[var(--card)] border-x border-[var(--border)] flex flex-col items-center py-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
          aria-label="Expand history sidebar"
        >
          <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
      </div>
    );
  }

  if (!promptId) {
    return (
      <div className="h-full w-[280px] border-x border-[var(--border)] bg-[var(--card)] flex flex-col">
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            History
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
              aria-label="Collapse history sidebar"
            >
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted-foreground)] text-xs">
            Select a prompt to view history
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-[280px] border-x border-[var(--border)] bg-[var(--card)] flex flex-col">
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            History
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
              aria-label="Collapse history sidebar"
            >
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-[280px] border-x border-[var(--border)] bg-[var(--card)] flex flex-col">
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            History
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
              aria-label="Collapse history sidebar"
            >
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted-foreground)] text-xs">Failed to load</p>
        </div>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="h-full w-[280px] border-x border-[var(--border)] bg-[var(--card)] flex flex-col">
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            History
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
              aria-label="Collapse history sidebar"
            >
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted-foreground)] text-xs">No games yet</p>
        </div>
      </div>
    );
  }

  const sortedVersions = versions ? [...versions].sort((a, b) => a.version - b.version) : [];

  return (
    <div className="h-full w-[280px] border-x border-[var(--border)] bg-[var(--card)] flex flex-col">
      {sortedVersions.length > 0 && (
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto">
          <GitBranch className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
          {sortedVersions.map((v) => {
            const variant = getVersionVariant(v, currentVersion, selectedVersionId);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVersion?.(v.id)}
                className="cursor-pointer shrink-0"
              >
                <ArcadeBadge text={`v${v.version}`} variant={variant} className="text-[10px]" />
              </button>
            );
          })}
          {onNewVersion && (
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={onNewVersion}
              className="h-5 w-5 p-0 shrink-0"
            >
              <Plus className="h-3 w-3" />
            </ArcadeButton>
          )}
          {sortedVersions.length > 1 && (
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={() => setCompareDialogOpen(true)}
              className="h-5 w-5 p-0 shrink-0"
            >
              <Scale className="h-3 w-3" />
            </ArcadeButton>
          )}
        </div>
      )}
      <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          History
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
            aria-label="Collapse history sidebar"
          >
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ul className="divide-y divide-[var(--border)]">
          {[...games].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((game: Game) => {
            const canSubmit = game.status === "completed" && !game.isSubmitted;
            const isSubmitting = submitMutation.isPending && submitMutation.variables === game.id;
            const isUnpublishing = unpublishingGameId === game.id;
            const isDeleting = deletingGameId === game.id;
            const isSelected = selectedGameId === game.id;

            return (
              <button
                key={game.id}
                type="button"
                className={`w-full text-left flex items-center justify-between p-2 transition-colors group cursor-pointer ${
                  isSelected 
                    ? "bg-[var(--primary)]/10 border-l-2 border-[var(--primary)]" 
                    : "hover:bg-[var(--muted)]/20"
                }`}
                onClick={() => onSelectGame?.(game)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectGame?.(game);
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStatusIcon(game.status)}
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
                </div>
                <span role="presentation" className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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

                  <GameActionsDropdown
                    game={game}
                    onSubmit={() => submitMutation.mutate(game.id)}
                    onUnpublish={() => handleUnpublish(game.id)}
                    onDelete={() => handleDeleteClick(game)}
                    isSubmitting={isSubmitting}
                    isUnpublishing={isUnpublishing}
                    isDeleting={isDeleting}
                  />
                </span>
              </button>
            );
          })}
        </ul>
      </div>

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

      {versions && versions.length > 1 && (
        <VersionComparisonDialog
          open={compareDialogOpen}
          onOpenChange={setCompareDialogOpen}
          versions={versions}
          currentVersion={currentVersion ?? 1}
        />
      )}
    </div>
  );
}
