import { ArcadeBadge, ArcadeCard, ArcadeButton } from "@/components/arcade";
import { Play, User, Clock, Star } from "lucide-react";
import type { AppRouter } from "@arcade-vibe/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type GameFromApi = RouterOutput["games"]["listByTheme"][number];

interface GameCardProps {
  game: GameFromApi;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  // Use tier from tierCost relation
  const tierLabel = game.tierCost?.slug ?? "unknown";
  const prompt = game.prompt as {
    id: string;
    content: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  const creatorName =
    prompt.user?.name || prompt.user?.email?.split("@")[0] || "Unknown";
  const createdAt = new Date(game.createdAt).toLocaleDateString();

  return (
    <ArcadeCard className="group overflow-hidden transition-all duration-300">
      {/* Game Thumbnail / Placeholder */}
      <div className="relative aspect-video bg-[var(--muted)] flex items-center justify-center overflow-hidden">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.theme?.title || "Game"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg">
              <Play className="h-8 w-8 text-[var(--primary-foreground)] ml-1" />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">
              AI Generated Game
            </p>
          </div>
        )}

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
            {game.theme?.title || "Untitled Game"}
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
          onClick={onClick}
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
