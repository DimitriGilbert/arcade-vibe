"use client";

import Link from "next/link";
import { Gamepad2, Loader2, Play, Star } from "lucide-react";

import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import type { PromptListGamesByPromptOutput } from "@/lib/trpc-types";

import { formatDateShort, formatRating } from "./prompt-utils";

type PromptGame = PromptListGamesByPromptOutput["items"][number];

export interface GamesListProps {
  games: PromptGame[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export function GamesList({
  games,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: GamesListProps) {
  if (isLoading) {
    const skeletonIds = Array.from({ length: 6 }, (_, i) => `sk-${i}`);
    return (
      <div className="space-y-3 animate-pulse">
        {skeletonIds.map((id) => (
          <div
            key={id}
            className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg"
          >
            <div className="w-8 h-8 bg-[var(--muted)] rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-1/3 bg-[var(--muted)] rounded" />
              <div className="h-2.5 w-1/4 bg-[var(--muted)] rounded" />
            </div>
            <div className="w-16 h-5 bg-[var(--muted)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-8 text-center">
        <Gamepad2 className="h-12 w-12 mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
        <p className="text-[var(--muted-foreground)]">No games yet</p>
        <Link href="/login">
          <ArcadeButton variant="primary" size="sm" className="mt-4">
            Create First Game
          </ArcadeButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game, idx) => (
        <Link
          key={game.id}
          href={`/game/${game.id}`}
          className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors group"
        >
          <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-[var(--muted)] rounded-lg">
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                {game.name || "Untitled Game"}
              </span>
              {game.isSubmitted && (
                <ArcadeBadge text="Submitted" variant="neon" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
              <span className="truncate max-w-[120px]">{game.modelName}</span>
              <span className="text-[var(--border)]">•</span>
              <span>{formatDateShort(game.createdAt)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {game.highScore !== null && (
              <p className="text-sm font-bold text-[var(--accent)]">
                {game.highScore.toLocaleString()}
              </p>
            )}
            {game.ratingCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Star className="h-3 w-3" />
                <span>{formatRating(game.avgRating)}</span>
              </div>
            )}
          </div>
          <Play className="h-4 w-4 text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>
      ))}

      {hasMore && (
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="w-full gap-2"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </ArcadeButton>
      )}
    </div>
  );
}
