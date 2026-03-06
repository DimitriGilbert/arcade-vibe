"use client";

import { Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GameWithRanking } from "@/lib/trpc-types";
import { GameCabinet } from "./game-cabinet";

export interface AllGamesGridProps {
  games: GameWithRanking[];
  total: number;
  page: number;
  hasMore: boolean;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AllGamesGrid({ games, total, page, hasMore, totalPages, onPageChange }: AllGamesGridProps) {
  if (games.length === 0) {
    return (
      <ArcadeCard className="p-8 text-center">
        <Gamepad2 className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/30 mb-3" />
        <p className="text-[var(--muted-foreground)]">No games yet</p>
      </ArcadeCard>
    );
  }

  return (
    <ArcadeCard>
      <ScrollArea className="min-h-[60vh] max-h-[120vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {games.map((game, idx) => (
            <GameCabinet key={game.id} game={game} rank={(page - 1) * 20 + idx + 1} />
          ))}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="p-3 border-t border-[var(--border)] flex items-center justify-between">
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
    </ArcadeCard>
  );
}
