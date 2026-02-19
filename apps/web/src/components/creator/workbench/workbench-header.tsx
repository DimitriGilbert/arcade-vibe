"use client";

import { useState, useCallback } from "react";
import { ArcadeBadge } from "@/components/arcade";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import type { CreditBalanceInfo } from "@/lib/trpc-types";

interface WorkbenchHeaderProps {
  promptName: string;
  onPromptNameChange: (name: string) => void;
  credits: CreditBalanceInfo | null | undefined;
  isLoading?: boolean;
}

export function WorkbenchHeader({
  promptName,
  onPromptNameChange,
  credits,
  isLoading,
}: WorkbenchHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editValue, setEditValue] = useState(promptName);

  const handleStartEdit = useCallback(() => {
    setEditValue(promptName);
    setIsEditingName(true);
  }, [promptName]);

  const handleSaveEdit = useCallback(() => {
    onPromptNameChange(editValue.trim() || "Untitled Prompt");
    setIsEditingName(false);
  }, [editValue, onPromptNameChange]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(promptName);
    setIsEditingName(false);
  }, [promptName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Prompt name..."
              maxLength={100}
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="p-1 rounded hover:bg-[var(--muted)] text-green-500"
              aria-label="Save name"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--primary)] transition-colors truncate"
          >
            <span className="truncate max-w-[200px]">{promptName || "Untitled Prompt"}</span>
            <Pencil className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
        ) : credits ? (
          <ArcadeBadge text={`${credits.balance} credits`} variant="neon" />
        ) : null}
      </div>
    </header>
  );
}
