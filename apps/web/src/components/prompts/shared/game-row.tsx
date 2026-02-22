import type { PromptListGamesByPromptOutput } from "@/lib/trpc-types";
import type { Route } from "next";

import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";

type GameItem = PromptListGamesByPromptOutput["items"][number];

export interface GameRowProps {
  game: GameItem;
  rank: number;
}

export function GameRow({ game, rank }: GameRowProps) {
  return (
    <Link href={`/game/${game.id}` as Route} className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/20 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-[var(--muted)]/30 flex items-center justify-center font-bold text-sm shrink-0">
        #{rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name ?? "Untitled Game"}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">{game.modelName}</p>
      </div>

      <div className="flex items-center gap-4 text-right shrink-0">
        {game.highScore !== null && (
          <div>
            <p className="font-bold text-[var(--primary)]">{game.highScore.toLocaleString()}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Score</p>
          </div>
        )}
        {game.avgRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">{game.avgRating.toFixed(1)}</span>
          </div>
        )}
        <div className="text-xs text-[var(--muted-foreground)]">
          {new Date(game.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}
