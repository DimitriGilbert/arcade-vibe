"use client";

import { useRouter } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";

export interface GameCabinetProps {
  game: GameWithRanking;
}

export function GameCabinet({ game }: GameCabinetProps) {
  const router = useRouter();

  return (
    <ArcadeCard
      className="group cursor-pointer hover:scale-[1.02] transition-transform"
      onClick={() => router.push(`/game/${game.id}`)}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[var(--primary)]/5" />
        <Gamepad2 className="w-16 h-16 text-[var(--primary)]/30 group-hover:text-[var(--primary)]/50 transition-colors" />

        {game.ranking && game.ranking <= 3 && (
          <div className="absolute top-3 left-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
              game.ranking === 1 ? 'bg-yellow-500 text-yellow-950' :
              game.ranking === 2 ? 'bg-slate-300 text-slate-800' :
              'bg-amber-600 text-amber-950'
            }`}>
              {game.ranking}
            </div>
          </div>
        )}

        {game.tierCost?.slug && (
          <div className="absolute top-3 right-3">
            <ArcadeBadge text={game.tierCost.slug} variant="neon" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name || game.theme?.title || "Untitled"}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
          {game.modelName && <span className="truncate">{game.modelName}</span>}
          {game.ranking && game.ranking > 3 && (
            <ArcadeBadge text={`#${game.ranking}`} variant="default" />
          )}
        </div>
      </div>
    </ArcadeCard>
  );
}
