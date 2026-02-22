import type { PromptListGamesByPromptOutput } from "@/lib/trpc-types";
import type { Route } from "next";

import Link from "next/link";
import { Play, Star } from "lucide-react";

import { ArcadeCard, ArcadeButton } from "@/components/arcade";

type GameItem = PromptListGamesByPromptOutput["items"][number];

export interface PodiumCardProps {
  game: GameItem;
  rank: number;
  isCenter?: boolean;
}

const rankStyles = {
  1: {
    container: "bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/30",
    badge: "bg-yellow-500 text-yellow-950",
    rankText: "1ST",
  },
  2: {
    container: "bg-gradient-to-br from-slate-400/10 via-slate-300/5 to-transparent border-slate-400/30",
    badge: "bg-slate-400 text-slate-950",
    rankText: "2ND",
  },
  3: {
    container: "bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border-amber-600/30",
    badge: "bg-amber-600 text-amber-50",
    rankText: "3RD",
  },
} as const;

export function PodiumCard({ game, rank, isCenter = false }: PodiumCardProps) {
  const style = rankStyles[rank as keyof typeof rankStyles] ?? rankStyles[1];

  return (
    <ArcadeCard variant={rank === 1 ? "glow" : "default"} className={`${style.container} ${isCenter ? "md:-mt-4" : ""}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
            {style.rankText}
          </span>
          {game.highScore !== null && (
            <span className="text-lg font-black text-[var(--primary)]">
              {game.highScore.toLocaleString()}
            </span>
          )}
        </div>

        <Link href={`/game/${game.id}` as Route} className="block">
          <h3 className="font-semibold mb-2 line-clamp-2 hover:text-[var(--primary)] transition-colors">
            {game.name ?? "Untitled Game"}
          </h3>
        </Link>

        <p className="text-xs text-[var(--muted-foreground)] mb-3">{game.modelName}</p>

        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-4">
          {game.avgRating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {game.avgRating.toFixed(1)}
            </span>
          )}
          <span>{game.ratingCount} ratings</span>
        </div>

        <Link href={`/game/${game.id}` as Route}>
          <ArcadeButton variant={rank === 1 ? "primary" : "outline"} className="w-full">
            <Play className="h-3.5 w-3.5" />
            Play
          </ArcadeButton>
        </Link>
      </div>
    </ArcadeCard>
  );
}
