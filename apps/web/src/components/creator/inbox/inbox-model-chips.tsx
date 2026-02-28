"use client";

import { Plus } from "lucide-react";
import { ModelChip } from "@/components/creator/shared";
import type { ModelSelection } from "./inbox-types";

interface InboxModelChipsProps {
  models: ModelSelection[];
  onRemoveModel: (id: string) => void;
  onAddModelClick: () => void;
  activeModelId: string | null;
  onModelClick: (id: string) => void;
  disabled?: boolean;
}

export function InboxModelChips({
  models,
  onRemoveModel,
  onAddModelClick,
  activeModelId,
  onModelClick,
  disabled = false,
}: InboxModelChipsProps) {
  const totalCredits = models.reduce((sum, m) => sum + m.creditCost, 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {models.map((model) => (
        <ModelChip
          key={model.id}
          model={model}
          onRemove={() => onRemoveModel(model.id)}
          onClick={() => onModelClick(model.id)}
          isActive={model.id === activeModelId}
        />
      ))}

      {models.length < 4 && (
        <button
          type="button"
          onClick={onAddModelClick}
          disabled={disabled}
          className="flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          Add model
        </button>
      )}

      {models.length > 0 && (
        <div className="flex items-center gap-1 ml-auto text-xs text-[var(--muted-foreground)]">
          Total: <span className="font-medium text-[var(--foreground)]">{totalCredits}cr</span>
        </div>
      )}
    </div>
  );
}
