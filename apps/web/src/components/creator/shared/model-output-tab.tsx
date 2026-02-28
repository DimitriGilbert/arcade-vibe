"use client";

import { memo } from "react";
import { Check, AlertCircle, Brain, Sparkles } from "lucide-react";
import type { GenerationStatus } from "@/lib/model-types";

function ModelStatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3.5 w-3.5 text-blue-400 animate-pulse" />;
    case "generating":
      return <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />;
    case "complete":
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-[var(--destructive)]" />;
    default:
      return null;
  }
}

interface ModelOutputTabProps {
  modelKey: string;
  modelName: string;
  status: GenerationStatus;
  isActive: boolean;
  onClick: () => void;
}

const ModelOutputTab = memo(function ModelOutputTab({
  modelName,
  status,
  isActive,
  onClick,
}: ModelOutputTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60",
      ].join(" ")}
    >
      <ModelStatusIcon status={status} />
      <span className="truncate max-w-[10rem]">{modelName}</span>
    </button>
  );
});

export { ModelOutputTab };
