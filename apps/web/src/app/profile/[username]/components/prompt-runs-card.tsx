import { Badge } from "@/components/ui/badge";
import { Gamepad2 } from "lucide-react";
import type { Game } from "@/types/entities";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import EmptyPlaceholder from "@/components/reusable/empty-placeholder";

interface PromptRunsCardProps {
  promptRuns: Game[];
  isLoading: boolean;
}

export function PromptRunsCard({ promptRuns, isLoading }: PromptRunsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border-border rounded-lg p-6">
        <LoadingPlaceholder />
      </div>
    );
  }

  if (promptRuns.length === 0) {
    return (
      <div className="bg-card border-border rounded-lg p-6">
        <EmptyPlaceholder />
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-lg p-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Gamepad2 className="h-5 w-5 text-primary" />
        Prompt Runs History
        <Badge variant="outline">{promptRuns.length}</Badge>
      </h2>
      <div className="space-y-4">
        {promptRuns.slice(0, 10).map((game) => (
          <div
            key={game.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.prompt.content.slice(0, 30)}
                className="w-16 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-12 bg-primary rounded flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">
                {game.prompt.content.slice(0, 60)}...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {game.theme?.title || "No theme"} •{" "}
                {new Date(game.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge
              variant={
                game.status === "completed" ? "default" : "secondary"
              }
            >
              {game.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
