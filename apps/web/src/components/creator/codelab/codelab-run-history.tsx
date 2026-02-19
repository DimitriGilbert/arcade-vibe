"use client";

import { useState } from "react";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, ChevronDown, ChevronRight, Play, Trash2, Loader2, Clock } from "lucide-react";
import type { CodelabRunCell, CodelabOutput } from "./types";
import type { GenerationStatus } from "@/components/editor/model-types";

interface CodelabRunHistoryProps {
  runs: CodelabRunCell[];
  onLoadRun?: (run: CodelabRunCell) => void;
  onDeleteRun?: (runId: string) => void;
  onPlayGame?: (gameId: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getStatusBadgeVariant(status: GenerationStatus): "default" | "neon" {
  return status === "complete" ? "neon" : "default";
}

interface RunItemProps {
  run: CodelabRunCell;
  index: number;
  onLoad?: (run: CodelabRunCell) => void;
  onDelete?: (run: CodelabRunCell) => void;
  onPlayGame?: (gameId: string) => void;
  deletingId: string | null;
}

function RunItem({
  run,
  index,
  onLoad,
  onDelete,
  onPlayGame,
  deletingId,
}: RunItemProps) {
  const [expanded, setExpanded] = useState(false);

  const outputs = Object.values(run.outputs);
  const completedOutputs = outputs.filter((o) => o.status === "complete");
  const errorOutputs = outputs.filter((o) => o.status === "error");
  const hasGames = completedOutputs.some((o) => o.gameId);
  const isDeleting = deletingId === run.id;

  const firstGameId = completedOutputs.find((o) => o.gameId)?.gameId;

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
      {/* Header */}
      <button
        type="button"
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--muted)]/30 w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          )}
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            Run [{index + 1}]
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {run.selectedModels.length} model{run.selectedModels.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(run.createdAt)}
          </div>
          <ArcadeBadge
            text={`${completedOutputs.length}/${outputs.length}`}
            variant={errorOutputs.length > 0 ? "default" : "neon"}
            className="text-[10px]"
          />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[var(--border)] p-3 space-y-2 bg-[var(--muted)]/10">
          {/* Prompt Preview */}
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
            {run.promptContent}
          </p>

          {/* Model Outputs */}
          <div className="space-y-1">
            {outputs.map((output) => (
              <div
                key={output.modelSelectionId}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate max-w-[60%]">{output.modelName}</span>
                <div className="flex items-center gap-2">
                  <ArcadeBadge
                    text={output.status}
                    variant={getStatusBadgeVariant(output.status)}
                    className="text-[10px]"
                  />
                  {output.gameId && onPlayGame && (
                    <button
                      type="button"
                      onClick={() => onPlayGame(output.gameId!)}
                      className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
            {onLoad && (
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={() => onLoad?.(run)}
                className="text-[10px] h-6"
              >
                Load Prompt
              </ArcadeButton>
            )}
            {firstGameId && onPlayGame && (
              <ArcadeButton
                variant="primary"
                size="sm"
                onClick={() => firstGameId && onPlayGame?.(firstGameId)}
                className="text-[10px] h-6"
              >
                <Play className="h-3 w-3" />
                Play
              </ArcadeButton>
            )}
            {onDelete && (
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={() => onDelete?.(run)}
                disabled={isDeleting}
                className="text-[10px] h-6 ml-auto text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </ArcadeButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CodelabRunHistory({
  runs,
  onLoadRun,
  onDeleteRun,
  onPlayGame,
}: CodelabRunHistoryProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState<CodelabRunCell | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (run: CodelabRunCell) => {
    setRunToDelete(run);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (runToDelete && onDeleteRun) {
      setDeletingId(runToDelete.id);
      onDeleteRun(runToDelete.id);
      setDeleteDialogOpen(false);
      setRunToDelete(null);
      setDeletingId(null);
    }
  };

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <History className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
        <p className="text-xs text-[var(--muted-foreground)]">
          No previous runs
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Run a prompt to see history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Run History ({runs.length})
        </span>
      </div>

      <div className="space-y-2">
        {runs.map((run, index) => (
          <RunItem
            key={run.id}
            run={run}
            index={index}
            onLoad={onLoadRun}
            onDelete={handleDeleteClick}
            onPlayGame={onPlayGame}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Run</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this run from history? This will only remove it from your local history.
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
              disabled={deletingId === runToDelete?.id}
              className="bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
            >
              {deletingId === runToDelete?.id ? "Deleting..." : "Delete"}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
