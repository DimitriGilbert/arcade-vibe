"use client";

import { memo } from "react";
import { Loader2 } from "lucide-react";

interface WaitingStateProps {
  status: "reasoning" | "generating";
  modelName?: string;
}

export const WaitingState = memo(function WaitingState({ status, modelName }: WaitingStateProps) {
  const text = status === "reasoning" ? "Reasoning..." : "Generating...";
  const modelText = modelName ? ` (${modelName})` : "";

  return (
    <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
        <span className="text-sm text-[var(--muted-foreground)]">
          {text}
          {modelText}
        </span>
      </div>
    </div>
  );
});
