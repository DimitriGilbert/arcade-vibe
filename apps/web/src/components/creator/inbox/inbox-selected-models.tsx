"use client";

import { memo } from "react";
import { X, Check, AlertCircle, Brain, Sparkles } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import type { ModelSelection, GenerationStatus } from "./inbox-types";

interface SelectedModelsListProps {
  models: ModelSelection[];
  onRemoveModel: (id: string) => void;
  disabled?: boolean;
  useGenerationStatus: (id: string) => GenerationStatus | undefined;
}

function StatusIcon({ status }: { status: GenerationStatus }) {
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

function StatusBadge({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return (
        <span className="text-xs text-purple-400 flex items-center gap-1">
          <Brain className="h-3 w-3 animate-pulse" />
          Thinking
        </span>
      );
    case "generating":
      return (
        <span className="text-xs text-blue-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3 animate-spin" />
          Generating
        </span>
      );
    case "complete":
      return (
        <span className="text-xs text-green-400 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Done
        </span>
      );
    case "error":
      return (
        <span className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      );
    default:
      return null;
  }
}

const ModelItem = memo(function ModelItem({
  model,
  onRemoveModel,
  disabled,
  useGenerationStatus,
}: {
  model: ModelSelection;
  onRemoveModel: (id: string) => void;
  disabled: boolean;
  useGenerationStatus: (id: string) => GenerationStatus | undefined;
}) {
  const status = useGenerationStatus(model.id) ?? "idle";
  const isActive = status === "reasoning" || status === "generating";

  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--card)] border border-[var(--border)] rounded-md">
      <StatusIcon status={status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {model.modelName}
          </span>
          {model.isByok ? (
            <ArcadeBadge text="BYOK" variant="neon" className="shrink-0" />
          ) : (
            <ArcadeBadge
              text={`${model.creditCost}cr`}
              variant="neon"
              className="shrink-0"
            />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--muted-foreground)]">
            {model.tierName}
          </span>
          {status !== "idle" && <StatusBadge status={status} />}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemoveModel(model.id)}
        disabled={disabled || isActive}
        className="p-1 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Remove ${model.modelName}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

export function InboxSelectedModels({
  models,
  onRemoveModel,
  disabled = false,
  useGenerationStatus,
}: SelectedModelsListProps) {
  if (models.length === 0) {
    return (
      <div className="text-sm text-[var(--muted-foreground)] text-center py-3 border border-dashed border-[var(--border)] rounded-md">
        No models selected
      </div>
    );
  }

  const totalCredits = models.reduce((sum, m) => sum + m.creditCost, 0);
  const hasByok = models.some((m) => m.isByok);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {models.map((model) => (
          <ModelItem
            key={model.id}
            model={model}
            onRemoveModel={onRemoveModel}
            disabled={disabled}
            useGenerationStatus={useGenerationStatus}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--muted-foreground)]">
          Total:
        </span>
        <div className="flex items-center gap-2">
          {hasByok && (
            <span className="text-xs text-[var(--muted-foreground)]">
              (+ BYOK)
            </span>
          )}
          <ArcadeBadge text={`${totalCredits}cr`} variant="neon" />
        </div>
      </div>
    </div>
  );
}
