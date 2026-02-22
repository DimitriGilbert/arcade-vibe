"use client";

import { Gamepad2 } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";
import { GameCabinet } from "./game-cabinet";

export interface AllGamesGridProps {
  games: GameWithRanking[];
}

export function AllGamesGrid({ games }: AllGamesGridProps) {
  if (games.length === 0) {
    return (
      <ArcadeCard className="p-8 text-center">
        <Gamepad2 className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/30 mb-3" />
        <p className="text-[var(--muted-foreground)]">No games yet</p>
      </ArcadeCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map(game => (
        <GameCabinet key={game.id} game={game} />
      ))}
    </div>
  );
}
