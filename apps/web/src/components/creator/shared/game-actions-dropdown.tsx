"use client";

import { memo } from "react";
import { Loader2, MoreHorizontal, Send, Trash2, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Game } from "@/lib/trpc-types";

interface GameActionsDropdownProps {
  game: Game;
  onSubmit: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  isSubmitting?: boolean;
  isUnpublishing?: boolean;
  isDeleting?: boolean;
}

export const GameActionsDropdown = memo(function GameActionsDropdown({
  game,
  onSubmit,
  onUnpublish,
  onDelete,
  isSubmitting = false,
  isUnpublishing = false,
  isDeleting = false,
}: GameActionsDropdownProps) {
  const canSubmit = game.status === "completed" && !game.isSubmitted;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--muted)] focus:opacity-100"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {canSubmit && (
          <DropdownMenuItem onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-2" />
            )}
            {isSubmitting ? "Submitting..." : "Submit"}
          </DropdownMenuItem>
        )}
        {canSubmit && game.isSubmitted && <DropdownMenuSeparator />}
        {game.isSubmitted && (
          <DropdownMenuItem onClick={onUnpublish} disabled={isUnpublishing}>
            {isUnpublishing ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 mr-2" />
            )}
            {isUnpublishing ? "Unpublishing..." : "Unpublish"}
          </DropdownMenuItem>
        )}
        {game.isSubmitted && <DropdownMenuSeparator />}
        {!game.isSubmitted && (
          <DropdownMenuItem onClick={onDelete} disabled={isDeleting} variant="destructive">
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 mr-2" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
