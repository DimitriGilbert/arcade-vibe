"use client";

import { useRouter } from "next/navigation";
import { Gamepad2, Trophy } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import type { GameWithRanking } from "@/lib/trpc-types";

export interface FeaturedGameCardProps {
  game: GameWithRanking;
  featured?: boolean;
}

export function FeaturedGameCard({ game, featured = false }: FeaturedGameCardProps) {
  const router = useRouter();

  const handleClick = () => router.push(`/game/${game.id}`);

  return (
    <div
      className={`group cursor-pointer ${featured ? 'col-span-2 row-span-2' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleClick(); }}}
      tabIndex={0}
      role="button"
      aria-label={`View game: ${game.name || 'Untitled'}`}
    >
      <ArcadeCard className={`h-full ${featured ? 'flex flex-col' : ''}`}>
        <div className={`relative bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center overflow-hidden ${featured ? 'aspect-video' : 'aspect-square'}`}>
          <Gamepad2 className={`${featured ? 'w-24 h-24' : 'w-12 h-12'} text-[var(--primary)]/20 group-hover:text-[var(--primary)]/40 transition-colors`} />

          {game.ranking && game.ranking <= 3 && (
            <div className="absolute top-4 left-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold ${
                game.ranking === 1 ? 'bg-yellow-500 text-yellow-950' :
                game.ranking === 2 ? 'bg-slate-300 text-slate-800' :
                'bg-amber-600 text-amber-950'
              }`}>
                <Trophy className="w-4 h-4" />
                #{game.ranking}
              </div>
            </div>
          )}

          {game.tierCost?.slug && (
            <div className="absolute top-4 right-4">
              <ArcadeBadge text={game.tierCost.slug} variant="neon" />
            </div>
          )}
        </div>

        <div className={`p-4 ${featured ? 'flex-1' : ''}`}>
          <h3 className={`font-bold ${featured ? 'text-xl' : 'text-sm'} truncate group-hover:text-[var(--primary)] transition-colors`}>
            {game.name || game.theme?.title || "Untitled Game"}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
            {game.modelName && <span>{game.modelName}</span>}
            <span>{new Date(game.createdAt).toLocaleDateString()}</span>
          </div>
          {featured && game.theme?.title && (
            <p className="text-sm text-[var(--muted-foreground)] mt-3">
              Part of the <span className="text-[var(--primary)]">{game.theme.title}</span> theme
            </p>
          )}
        </div>
      </ArcadeCard>
    </div>
  );
}
