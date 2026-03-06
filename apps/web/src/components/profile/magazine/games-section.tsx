"use client";

import { Gamepad2 } from "lucide-react";
import { EmptyState } from "@/components/reusable";
import type { GameWithRanking } from "@/lib/trpc-types";
import { FeaturedGameCard } from "./featured-game-card";

export interface GamesSectionProps {
  games: GameWithRanking[];
  page: number;
}

export function GamesSection({ games, page }: GamesSectionProps) {
  if (games.length === 0) {
    return (
      <section className="mb-16">
        <EmptyState
          icon={<Gamepad2 className="h-8 w-8 opacity-50" />}
          title="No Games Yet"
          message="Games will appear here once created."
        />
      </section>
    );
  }

  const featured = games[0];
  const rest = games.slice(1, 7);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-[var(--primary)]" />
          Game Collection
        </h2>
      </div>

      <div className="grid grid-cols-4 grid-rows-2 gap-4">
        {featured && (
          <div className="col-span-1 row-span-2">
            <FeaturedGameCard game={featured} rank={(page - 1) * 7 + 1} variant="featured" />
          </div>
        )}
        {rest.slice(0, 3).map((game, idx) => (
          <div key={game.id} className="col-span-1">
            <FeaturedGameCard game={game} rank={(page - 1) * 7 + idx + 2} />
          </div>
        ))}
        {rest.slice(3, 6).map((game, idx) => (
          <div key={game.id} className="col-span-1">
            <FeaturedGameCard game={game} rank={(page - 1) * 7 + idx + 5} />
          </div>
        ))}
      </div>
    </section>
  );
}
