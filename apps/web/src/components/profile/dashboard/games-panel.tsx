"use client";

import { Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/reusable";
import { GameRow } from "@/components/profile/shared";
import type { GameWithRanking } from "@/lib/trpc-types";

export interface GamesPanelProps {
  games: GameWithRanking[];
  total: number;
  page: number;
  hasMore: boolean;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function GamesPanel({ games, total, page, hasMore, totalPages, onPageChange }: GamesPanelProps) {
  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
            Games
          </h2>
          <ArcadeBadge text={String(total)} variant="default" />
        </div>
      </div>

      {games.length === 0 ? (
        <EmptyState
          icon={<Gamepad2 className="h-8 w-8 opacity-50" />}
          message="No games yet"
        />
      ) : (
        <>
          <ScrollArea className="min-h-[50vh] max-h-[120vh]">
            <div className="divide-y divide-[var(--border)]">
              {games.map((game, idx) => (
                <GameRow key={game.id} game={game} rank={(page - 1) * 20 + idx + 1} />
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
        </>
      )}
    </ArcadeCard>
  );
}
