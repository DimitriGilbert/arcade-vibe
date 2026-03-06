"use client";

import { Zap } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/reusable";
import type { Prompt } from "@/lib/trpc-types";

export interface PromptsPanelProps {
  prompts: Prompt[];
}

export function PromptsPanel({ prompts }: PromptsPanelProps) {
  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            Prompts
          </h2>
          <ArcadeBadge text={String(prompts.length)} variant="default" />
        </div>
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-8 w-8 opacity-50" />}
          message="No prompts yet"
        />
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-[var(--border)]">
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
        </ScrollArea>
      )}
    </ArcadeCard>
  );
}
