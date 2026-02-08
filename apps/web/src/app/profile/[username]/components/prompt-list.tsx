import { GitBranch, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
              <Badge
                variant="outline"
                className="text-xs whitespace-nowrap"
              >
                v{prompt.version}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(prompt.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {prompt.visibility}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
