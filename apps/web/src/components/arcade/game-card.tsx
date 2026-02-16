import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ArcadeBadge, ArcadeCard, ArcadeButton } from "@/components/arcade";
import { Play, User, Clock, Star, Gamepad2 } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import type { GameFromApi } from "@/lib/trpc-types";

interface GameCardProps {
  game: GameFromApi;
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  const tierLabel = game.tierCost?.slug ?? "unknown";
  const prompt = game.prompt as {
    id: string;
    content: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  const creatorName = prompt.user?.name || "Unknown";
  const createdAt = new Date(game.createdAt).toLocaleDateString();

  const handlePrefetch = useCallback(async () => {
    if (isPrefetching) return;
    setIsPrefetching(true);
    try {
      await queryClient.prefetchQuery({
        queryKey: ["game", game.id],
        queryFn: () => trpcClient.games.getById.query({ id: game.id }),
      });
    } catch {
      // Ignore prefetch errors
    }
  }, [game.id, queryClient, isPrefetching]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push(`/game/${game.id}`);
      }
    },
    [game.id, router],
  );

  return (
    <ArcadeCard
      className="group overflow-hidden transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:ring-offset-2"
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${game.name || "Untitled Game"} by ${creatorName}`}
    >
      {/* Game Thumbnail / Placeholder */}
      <div className="relative aspect-video bg-[var(--muted)] flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg">
            <Gamepad2 className="h-8 w-8 text-[var(--primary-foreground)]" />
          </div>
          <p className="text-xs text-[var(--muted-foreground)] font-medium">
            AI Generated Game
          </p>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3 shadow-lg">
          <ArcadeBadge text={tierLabel} variant="default" />
        </div>

        {/* Submitted Badge */}
        {game.isSubmitted && (
          <div className="absolute top-3 left-3 shadow-lg">
            <ArcadeBadge
              text="Submitted"
              variant="neon"
              icon={<Star className="h-3 w-3" />}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Theme Title */}
        <div className="mb-3">
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
            {game.name || game.theme?.title || "Untitled Game"}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1">
            {prompt.content?.slice(0, 100)}
            {prompt.content && prompt.content.length > 100 && "..."}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{creatorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{createdAt}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pt-0">
        <ArcadeButton
          onClick={() => router.push(`/game/${game.id}`)}
          variant="primary"
          className="w-full font-medium"
        >
          <Play className="h-4 w-4 mr-2" />
          Play Now
        </ArcadeButton>
      </div>
    </ArcadeCard>
  );
}
