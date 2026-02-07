import { GitBranch, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Prompt {
  id: string;
  authorId: string;
  themeId: string;
  parentId: string | null;
  content: string;
  contentHash: string;
  tokenCount: number;
  tokenizer: string;
  version: number;
  visibility: "private" | "public_on_freeze" | "public";
  status: "draft" | "submitted" | "disqualified";
  hiddenAt: string | null;
  createdAt: string;
  updatedAt: string;
  hiddenReason: string | null;
  hiddenBy: string | null;
}

interface PromptListProps {
  prompts: Prompt[];
  isLoading?: boolean;
}

export function PromptList({ prompts, isLoading }: PromptListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prompts found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors"
        >
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <GitBranch className="h-4 w-4 text-white" />
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
