"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { History, Play, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Game, GameStatus } from "@/lib/trpc-types";

interface GenerationsHistoryProps {
  promptId: string | null;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status: GameStatus): "default" | "neon" {
  if (status === "completed") return "neon";
  return "default";
}

export function GenerationsHistory({ promptId }: GenerationsHistoryProps) {
  const queryClient = useQueryClient();

  const {
    data: games,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["games-by-prompt", promptId],
    queryFn: async () => {
      if (!promptId) return [];
      const result = await trpcClient.games.listByPrompt.query({ promptId });
      return result ?? [];
    },
    enabled: !!promptId,
  });

  const submitMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await trpcClient.games.submit.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game submitted successfully!");
      void queryClient.invalidateQueries({ queryKey: ["games", "prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
      void queryClient.invalidateQueries({ queryKey: ["games-initial"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit game");
    },
  });

  if (!promptId) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <p className="text-[var(--muted-foreground)] text-sm">
          Select or create a prompt to view generation history.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <p className="text-[var(--muted-foreground)] text-sm">
          Failed to load generation history.
        </p>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="h-full min-h-0 border border-[var(--border)] rounded-md flex items-center justify-center bg-[var(--muted)]/10">
        <p className="text-[var(--muted-foreground)] text-sm">
          No generations yet. Generate a game to see history.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 border border-[var(--border)] rounded-md overflow-y-auto bg-[var(--muted)]/10">
      <ul className="divide-y divide-[var(--border)]">
        {games.map((game: Game) => {
          const canSubmit = game.status === "completed" && !game.submittedAt;
          const isSubmitting =
            submitMutation.isPending && submitMutation.variables === game.id;

          return (
            <li
              key={game.id}
              className="flex items-center justify-between p-3 hover:bg-[var(--muted)]/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-[var(--foreground)] truncate">
                    {(game.name || game.modelName) ?? "Unknown model"}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(game.createdAt)}
                  </span>
                </div>
                <ArcadeBadge
                  text={game.status}
                  variant={getStatusVariant(game.status)}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/game/${game.id}`, "_blank")}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Play
                </ArcadeButton>
                {canSubmit && (
                  <ArcadeButton
                    variant="primary"
                    size="sm"
                    onClick={() => submitMutation.mutate(game.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Submit
                      </>
                    )}
                  </ArcadeButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
