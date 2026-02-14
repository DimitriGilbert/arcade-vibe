import { ArcadeBadge } from "@/components/arcade";
import { Gamepad2 } from "lucide-react";
import type { Game } from "@/lib/trpc-types";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import EmptyPlaceholder from "@/components/reusable/empty-placeholder";

interface PromptRunsCardProps {
  promptRuns: Game[];
  isLoading: boolean;
}

export function PromptRunsCard({ promptRuns, isLoading }: PromptRunsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6">
        <LoadingPlaceholder />
      </div>
    );
  }

  if (promptRuns.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6">
        <EmptyPlaceholder />
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
        Prompt Runs History
        <ArcadeBadge text={String(promptRuns.length)} variant="default" />
      </h2>
      <div className="space-y-4">
        {promptRuns.slice(0, 10).map((game) => (
          <button
            type="button"
            key={game.id}
            className="w-full flex items-start gap-3 p-3 rounded-lg bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors cursor-pointer text-left"
            onClick={() => {
              window.location.href = `/game/${game.id}`;
            }}
          >
            <div className="w-16 h-12 bg-[var(--primary)] rounded flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-[var(--primary-foreground)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[var(--foreground)]">
                {game.prompt.content.slice(0, 60)}...
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {game.theme?.title || "No theme"} •{" "}
                {new Date(game.createdAt).toLocaleString()}
              </p>
            </div>
            <ArcadeBadge
              text={game.status}
              variant={game.status === "completed" ? "neon" : "default"}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
