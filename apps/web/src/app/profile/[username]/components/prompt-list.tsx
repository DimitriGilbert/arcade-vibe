import { GitBranch, Calendar } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import type { Prompt } from "@/types/entities";

interface PromptListProps {
  prompts: Prompt[];
  isLoading?: boolean;
}

export function PromptList({ prompts, isLoading }: PromptListProps) {
  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState centered />
      </div>
    );
  }

  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center py-8">
        <EmptyState message="No data available" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-[var(--muted)]/40 hover:bg-[var(--muted)]/60 transition-colors"
        >
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-[var(--primary)]">
              <GitBranch className="h-4 w-4 text-[var(--primary-foreground)]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate flex-1">
                {prompt.content.slice(0, 60)}
                {prompt.content.length > 60 && "..."}
              </p>
              <ArcadeBadge text={`v${prompt.version}`} variant="default" />
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(prompt.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <ArcadeBadge text={prompt.visibility} variant="default" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
