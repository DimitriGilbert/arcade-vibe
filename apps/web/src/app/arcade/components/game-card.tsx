import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, User, Clock, Star } from "lucide-react";
import type { AppRouter } from "@arcade-vibe/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type GameFromApi = RouterOutput["games"]["listByTheme"][number];

interface GameCardProps {
  game: GameFromApi;
  onClick: () => void;
}

const TIER_CONFIG = {
  cheater: { label: "Cheater", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" },
  impossible: { label: "Impossible", color: "bg-purple-500", textColor: "text-purple-600", bgColor: "bg-purple-50" },
  hard: { label: "Hard", color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50" },
  normal: { label: "Normal", color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
  easy: { label: "Easy", color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
};

export function GameCard({ game, onClick }: GameCardProps) {
  const tierInfo = TIER_CONFIG[game.modelTier];
  const prompt = game.prompt as { id: string; content: string; user: { id: string; name: string | null; email: string; image: string | null } };
  const creatorName = prompt.user?.name || prompt.user?.email?.split("@")[0] || "Unknown";
  const createdAt = new Date(game.createdAt).toLocaleDateString();

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-2 hover:border-purple-400 dark:hover:border-purple-500">
      {/* Game Thumbnail / Placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 flex items-center justify-center overflow-hidden">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.theme?.title || "Game"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">AI Generated Game</p>
          </div>
        )}

        {/* Difficulty Badge */}
        <Badge className="absolute top-3 right-3 shadow-lg" variant="secondary">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${tierInfo.color}`} />
          {tierInfo.label}
        </Badge>

        {/* Submitted Badge */}
        {game.isSubmitted && (
          <Badge className="absolute top-3 left-3 shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Theme Title */}
        <div className="mb-3">
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {game.theme?.title || "Untitled Game"}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {prompt.content?.slice(0, 100)}
            {prompt.content && prompt.content.length > 100 && "..."}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{creatorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{createdAt}</span>
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={onClick}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
        >
          <Play className="h-4 w-4 mr-2" />
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
}
