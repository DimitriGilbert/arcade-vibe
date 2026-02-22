"use client";

import { useRouter } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";

export interface GameRowProps {
  game: GameWithRanking;
  rank: number;
}

export function GameRow({ game, rank }: GameRowProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)]/30 transition-colors text-left group"
      onClick={() => router.push(`/game/${game.id}`)}
    >
      <div className="w-8 text-center">
        {game.ranking && game.ranking <= 3 ? (
          <span className={`font-bold ${
            game.ranking === 1 ? 'text-yellow-500' :
            game.ranking === 2 ? 'text-slate-300' :
            'text-amber-600'
          }`}>
            #{game.ranking}
          </span>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">#{rank}</span>
        )}
      </div>

      <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center">
        <Gamepad2 className="w-6 h-6 text-[var(--primary)]/40 group-hover:text-[var(--primary)] transition-colors" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name || game.theme?.title || "Untitled"}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {game.modelName && <span className="truncate">{game.modelName}</span>}
          <span>{new Date(game.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {game.tierCost?.slug && (
          <ArcadeBadge text={game.tierCost.slug} variant="default" />
        )}
        <ArcadeBadge text={game.ranking ? `#${game.ranking}` : 'NR'} variant={game.ranking && game.ranking <= 3 ? 'neon' : 'default'} />
      </div>
    </button>
  );
}
