"use client";

import { memo } from "react";
import { X, Check, AlertCircle, Brain, Sparkles } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import type { ModelSelection, GenerationStatus } from "@/lib/trpc-types";
import { useGenerationStatus } from "@/stores/generations-store";

interface StatusIconProps {
  status: GenerationStatus;
}

function StatusIcon({ status }: StatusIconProps) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3 w-3 animate-pulse text-purple-400" />;
    case "generating":
      return <Sparkles className="h-3 w-3 animate-spin text-cyan-400" />;
    case "complete":
      return <Check className="h-3 w-3 text-green-400" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
}

export interface ModelChipProps {
  model: ModelSelection;
  onRemove?: () => void;
  onClick?: () => void;
  isActive?: boolean;
}

function ModelChipComponent({ model, onRemove, onClick, isActive = false }: ModelChipProps) {
  const status = useGenerationStatus(model.id) ?? "idle";
  const isGenerating = status === "reasoning" || status === "generating";

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const handleClick = () => {
    onClick?.();
  };

  return (
    <button
      type="button"
      className={[
        "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs cursor-pointer transition-all",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15"
          : "border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50",
      ].join(" ")}
      onClick={handleClick}
      disabled={!onClick}
    >
      <StatusIcon status={status} />
      <span className="truncate max-w-[80px]" title={model.modelName}>
        {model.modelName}
      </span>
      {model.isByok ? (
        <ArcadeBadge text="BYOK" variant="neon" className="text-[10px] px-1" />
      ) : (
        <span className="text-[var(--muted-foreground)]">{model.creditCost}cr</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isGenerating}
          className="ml-0.5 p-0.5 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Remove ${model.modelName}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </button>
  );
}

export const ModelChip = memo(ModelChipComponent);
