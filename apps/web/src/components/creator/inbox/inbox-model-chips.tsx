"use client";

import { memo } from "react";
import { X, Check, AlertCircle, Brain, Sparkles, Plus } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import type { GenerationStatus, ModelSelection } from "./inbox-types";
import { useGenerationStatus } from "@/stores/generations-store";

interface ModelChipProps {
  model: ModelSelection;
  onRemove: (id: string) => void;
  disabled: boolean;
  isActive: boolean;
  onClick: () => void;
}

function StatusIndicator({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3 w-3 animate-pulse text-purple-400" />;
    case "generating":
      return <Sparkles className="h-3 w-3 animate-spin text-blue-400" />;
    case "complete":
      return <Check className="h-3 w-3 text-green-400" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
}

const ModelChip = memo(function ModelChip({
  model,
  onRemove,
  disabled,
  isActive,
  onClick,
}: ModelChipProps) {
  const status = useGenerationStatus(model.id) ?? "idle";
  const isActiveGeneration = status === "reasoning" || status === "generating";

  return (
    <button
      type="button"
      className={[
        "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs cursor-pointer transition-all",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15"
          : "border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50",
      ].join(" ")}
      onClick={onClick}
    >
      <StatusIndicator status={status} />
      <span className="truncate max-w-[80px]">{model.modelName}</span>
      {model.isByok ? (
        <ArcadeBadge text="BYOK" variant="neon" className="text-[10px] px-1" />
      ) : (
        <span className="text-[var(--muted-foreground)]">{model.creditCost}cr</span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(model.id);
        }}
        disabled={disabled || isActiveGeneration}
        className="ml-0.5 p-0.5 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Remove ${model.modelName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </button>
  );
});

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
          onRemove={onRemoveModel}
          disabled={disabled}
          isActive={model.id === activeModelId}
          onClick={() => onModelClick(model.id)}
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
