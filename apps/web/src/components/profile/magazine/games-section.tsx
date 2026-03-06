"use client";

import { Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import type { GameWithRanking } from "@/lib/trpc-types";
import { FeaturedGameCard } from "./featured-game-card";

export interface GamesSectionProps {
  games: GameWithRanking[];
  page: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function GamesSection({ games, page, total, hasMore, totalPages, onPageChange }: GamesSectionProps) {
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

      {totalPages > 1 && (
        <div className="mb-6 flex items-center justify-between">
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </ArcadeButton>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasMore}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </ArcadeButton>
        </div>
      )}

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
