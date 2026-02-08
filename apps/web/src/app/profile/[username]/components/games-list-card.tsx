import { Badge } from "@/components/ui/badge";
import { Gamepad2 } from "lucide-react";
import type { GameWithRanking } from "@/types/entities";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import EmptyPlaceholder from "@/components/reusable/empty-placeholder";

interface GamesListCardProps {
  games: GameWithRanking[];
  isLoading: boolean;
}

export function GamesListCard({ games, isLoading }: GamesListCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border-border rounded-lg p-6">
        <LoadingPlaceholder />
      </div>
    );
  }

  if (games.length === 0) {
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
        Games
        <Badge variant="outline">{games.length}</Badge>
      </h2>
      <div className="space-y-4">
        {games.slice(0, 5).map((game) => (
          <button
            key={game.id}
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left"
            onClick={() => {
              const target = `/play?gameId=${game.id}`;
              window.location.href = target;
            }}
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
              <p className="font-medium text-sm truncate text-foreground">
                {game.prompt.content.slice(0, 50)}...
              </p>
              <p className="text-xs text-muted-foreground">
                {game.theme?.title || "No theme"} •{" "}
                {new Date(game.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {game.ranking && (
                <Badge variant="outline" className="text-xs">
                  Rank #{game.ranking}
                </Badge>
              )}
              <Badge
                variant={
                  game.status === "completed" ? "default" : "secondary"
                }
              >
                {game.status}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
