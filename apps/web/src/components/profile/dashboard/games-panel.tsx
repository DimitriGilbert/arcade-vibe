"use client";

import { Gamepad2 } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { GameRow } from "@/components/profile/shared";
import type { GameWithRanking } from "@/lib/trpc-types";

export interface GamesPanelProps {
  games: GameWithRanking[];
}

export function GamesPanel({ games }: GamesPanelProps) {
  if (games.length === 0) {
    return (
      <ArcadeCard className="h-full">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
              Games
            </h2>
            <ArcadeBadge text="0" variant="default" />
          </div>
        </div>
        <div className="p-8 text-center text-[var(--muted-foreground)]">
          <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No games yet</p>
        </div>
      </ArcadeCard>
    );
  }

  return (
    <ArcadeCard className="h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
            Games
          </h2>
          <ArcadeBadge text={String(games.length)} variant="default" />
        </div>
      </div>

      <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
        {games.slice(0, 10).map((game, idx) => (
          <GameRow key={game.id} game={game} rank={idx + 1} />
        ))}
      </div>

      {games.length > 10 && (
        <div className="p-3 border-t border-[var(--border)] text-center">
          <span className="text-xs text-[var(--muted-foreground)]">
            +{games.length - 10} more games
          </span>
        </div>
      )}
    </ArcadeCard>
  );
}
