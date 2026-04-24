"use client";

import { useRouter } from "next/navigation";
import { Gamepad2, Trophy } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";

export interface FeaturedGameCardProps {
  game: GameWithRanking;
  rank: number;
  variant?: "featured" | "default";
}

export function FeaturedGameCard({ game, rank, variant = "default" }: FeaturedGameCardProps) {
  const router = useRouter();
  const isFeatured = variant === "featured";

  const handleClick = () => router.push(`/game/${game.id}`);

  return (
    <div
      className="group cursor-pointer h-full"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleClick(); }}}
      tabIndex={0}
      role="button"
      aria-label={`View game: ${game.name || 'Untitled'}`}
    >
      <ArcadeCard className={`h-full ${isFeatured ? 'flex flex-col' : ''} p-4`}>
        {isFeatured && (
          <div className="relative bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center aspect-video mb-4 rounded overflow-hidden">
            {game.thumbnailUrl ? (
              <img
                src={game.thumbnailUrl}
                alt={game.name || "Game"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Gamepad2 className="w-16 h-16 text-[var(--primary)]/20 group-hover:text-[var(--primary)]/40 transition-colors" />
            )}
          </div>
        )}

        <div className={`flex-1 ${isFeatured ? '' : ''}`}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {game.ranking && game.ranking <= 3 ? (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  game.ranking === 1 ? 'bg-yellow-500 text-yellow-950' :
                  game.ranking === 2 ? 'bg-slate-300 text-slate-800' :
                  'bg-amber-600 text-amber-950'
                }`}>
                  <Trophy className="w-3 h-3" />
                  #{game.ranking}
                </div>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]">#{rank}</span>
              )}
            </div>
            {game.tierCost?.slug && (
              <ArcadeBadge text={game.tierCost.slug} variant="neon" />
            )}
          </div>

          <h3 className={`font-semibold ${isFeatured ? 'text-lg' : 'text-sm'} truncate group-hover:text-[var(--primary)] transition-colors mb-2`}>
            {game.name || game.theme?.title || "Untitled Game"}
          </h3>

          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            {game.modelName && <span className="truncate">{game.modelName}</span>}
            <span className="shrink-0">{new Date(game.createdAt).toLocaleDateString()}</span>
          </div>

          {game.theme?.title && (
            <p className="text-xs text-[var(--muted-foreground)] mt-2 truncate">
              Theme: <span className="text-[var(--primary)]">{game.theme.title}</span>
            </p>
          )}
        </div>
      </ArcadeCard>
    </div>
  );
}
