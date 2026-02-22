"use client";

import { Trophy } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";
import { GameCabinet } from "./game-cabinet";

export interface TrophyCaseProps {
  games: GameWithRanking[];
}

export function TrophyCase({ games }: TrophyCaseProps) {
  const rankedGames = games
    .filter(g => g.ranking !== null)
    .sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));

  if (rankedGames.length === 0) {
    return (
      <ArcadeCard className="p-8 text-center">
        <Trophy className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/30 mb-3" />
        <p className="text-[var(--muted-foreground)]">No ranked games yet</p>
        <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">Submit games to compete on the leaderboard!</p>
      </ArcadeCard>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rankedGames.slice(0, 8).map(game => (
        <GameCabinet key={game.id} game={game} />
      ))}
    </div>
  );
}
