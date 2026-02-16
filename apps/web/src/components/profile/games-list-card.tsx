import { useRouter } from "next/navigation";
import { ArcadeBadge } from "@/components/arcade";
import { Gamepad2 } from "lucide-react";
import type { GameWithRanking } from "@/lib/trpc-types";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import EmptyPlaceholder from "@/components/reusable/empty-placeholder";

interface GamesListCardProps {
  games: GameWithRanking[];
  isLoading: boolean;
}

export function GamesListCard({ games, isLoading }: GamesListCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6">
        <LoadingPlaceholder />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6">
        <EmptyPlaceholder message="No games created yet" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
        Games
        <ArcadeBadge text={String(games.length)} variant="default" />
      </h2>
      <div className="space-y-4">
        {games.slice(0, 5).map((game) => (
          <button
            key={game.id}
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            onClick={() => router.push(`/game/${game.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/game/${game.id}`);
              }
            }}
          >
            <div className="w-16 h-12 bg-[var(--primary)] rounded flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-[var(--primary-foreground)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-[var(--foreground)]">
                {game.name || game.theme?.title || "Untitled Game"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {game.theme?.title || "No theme"} •{" "}
                {new Date(game.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {game.ranking && (
                <ArcadeBadge text={`Rank #${game.ranking}`} variant="default" />
              )}
              <ArcadeBadge
                text={game.status}
                variant={game.status === "completed" ? "neon" : "default"}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
