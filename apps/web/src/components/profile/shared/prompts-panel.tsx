"use client";

import { Zap } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import type { Prompt } from "@/lib/trpc-types";

export interface PromptsPanelProps {
  prompts: Prompt[];
}

export function PromptsPanel({ prompts }: PromptsPanelProps) {
  if (prompts.length === 0) {
    return (
      <ArcadeCard className="h-full">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--primary)]" />
              Prompts
            </h2>
            <ArcadeBadge text="0" variant="default" />
          </div>
        </div>
        <div className="p-8 text-center text-[var(--muted-foreground)]">
          <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No prompts yet</p>
        </div>
      </ArcadeCard>
    );
  }

  return (
    <ArcadeCard className="h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            Prompts
          </h2>
          <ArcadeBadge text={String(prompts.length)} variant="default" />
        </div>
      </div>

      <div className="divide-y divide-[var(--border)] max-h-[300px] overflow-y-auto">
        {prompts.slice(0, 6).map(prompt => (
          <div key={prompt.id} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ArcadeBadge text={`v${prompt.version}`} variant="default" />
              <ArcadeBadge text={prompt.visibility} variant="default" />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
              {prompt.title || `${prompt.content.slice(0, 100)}...`}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">
              {new Date(prompt.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </ArcadeCard>
  );
}
