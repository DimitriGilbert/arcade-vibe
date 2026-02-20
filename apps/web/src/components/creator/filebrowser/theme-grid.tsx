"use client";

import { Plus, FileCode } from "lucide-react";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import type { PromptNode } from "./types";

interface ThemeGridProps {
  themeId: string;
  themeTitle: string;
  prompts: PromptNode[] | undefined;
  isLoading: boolean;
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export function ThemeGrid({
  themeId,
  themeTitle,
  prompts,
  isLoading,
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
}: ThemeGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse text-lg font-medium text-[var(--muted-foreground)]">
            Loading prompts...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{themeTitle}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {prompts?.length ?? 0} prompts
          </p>
        </div>
        <ArcadeButton onClick={onNewPrompt}>
          <Plus className="h-4 w-4" />
          New Prompt
        </ArcadeButton>
      </div>

      {prompts && prompts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {prompts.map((prompt) => (
            <ArcadeCard
              key={prompt.id}
              className={`cursor-pointer transition-all hover:border-[var(--primary)] ${
                selectedPromptId === prompt.id ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : ""
              }`}
              onClick={() => onSelectPrompt(prompt.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  <FileCode className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 mb-1">
                    {truncateContent(prompt.content, 80)}
                  </p>
                  <div className="flex items-center gap-2">
                    <ArcadeBadge text={`v${prompt.version}`} variant="default" />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatRelativeTime(prompt.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </ArcadeCard>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileCode className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium mb-2">No prompts yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Create your first prompt for this theme
          </p>
          <ArcadeButton onClick={onNewPrompt}>
            <Plus className="h-4 w-4" />
            New Prompt
          </ArcadeButton>
        </div>
      )}
    </div>
  );
}
