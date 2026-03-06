"use client";

import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/reusable";
import type { Prompt } from "@/lib/trpc-types";

export interface PromptsPanelProps {
  prompts: Prompt[];
  total: number;
  page: number;
  hasMore: boolean;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PromptsPanel({ prompts, total, page, hasMore, totalPages, onPageChange }: PromptsPanelProps) {
  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            Prompts
          </h2>
          <ArcadeBadge text={String(total)} variant="default" />
        </div>
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-8 w-8 opacity-50" />}
          message="No prompts yet"
        />
      ) : (
        <>
          <ScrollArea className="min-h-[50vh] max-h-[120vh]">
            <div className="divide-y divide-[var(--border)]">
              {prompts.map((prompt) => (
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

          {totalPages > 1 && (
            <div className="p-3 border-t border-[var(--border)] flex items-center justify-between">
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </ArcadeButton>
              <span className="text-sm text-[var(--muted-foreground)]">
                Page {page} of {totalPages}
              </span>
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={!hasMore}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </ArcadeButton>
            </div>
          )}
        </>
      )}
    </ArcadeCard>
  );
}
