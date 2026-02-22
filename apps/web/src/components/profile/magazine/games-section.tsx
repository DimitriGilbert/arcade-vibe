"use client";

import { Gamepad2, Trophy } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";
import { FeaturedGameCard } from "./featured-game-card";

export interface GamesSectionProps {
  games: GameWithRanking[];
}

export function GamesSection({ games }: GamesSectionProps) {
  if (games.length === 0) {
    return (
      <ArcadeCard className="p-12 text-center col-span-full">
        <Gamepad2 className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
        <p className="text-[var(--muted-foreground)]">Games will appear here once created.</p>
      </ArcadeCard>
    );
  }

  const rankedGames = games.filter(g => g.ranking !== null).sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
  const otherGames = games.filter(g => g.ranking === null);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-[var(--primary)]" />
          Game Collection
        </h2>
        <ArcadeBadge text={`${games.length} total`} variant="default" />
      </div>

      {rankedGames.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm uppercase tracking-widest text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Ranked Entries
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rankedGames.slice(0, 5).map((game, idx) => (
              <FeaturedGameCard key={game.id} game={game} featured={idx === 0 && game.ranking === 1} />
            ))}
          </div>
        </div>
      )}

      {otherGames.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Other Games</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {otherGames.slice(0, 6).map(game => (
              <FeaturedGameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
