"use client";

import { Target, Star, Gamepad2, Zap } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { GameWithRanking, Rating } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

export interface QuickStatsProps {
  stats: ProfileStats;
  games: GameWithRanking[];
  ratings: Rating[];
}

export function QuickStats({ stats, games, ratings }: QuickStatsProps) {
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length).toFixed(1)
    : null;

  const topRank = games.filter(g => g.ranking !== null).reduce(
    (best, g) => g.ranking && (!best || g.ranking < best) ? g.ranking : best,
    null as number | null
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ArcadeCard className="p-4 text-center">
        <Target className="w-8 h-8 mx-auto text-[var(--primary)] mb-2" />
        <div className="text-2xl font-bold">{topRank ? `#${topRank}` : '-'}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Best Rank</div>
      </ArcadeCard>
      <ArcadeCard className="p-4 text-center">
        <Star className="w-8 h-8 mx-auto text-[var(--accent)] mb-2" />
        <div className="text-2xl font-bold">{avgRating || '-'}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Avg Rating Given</div>
      </ArcadeCard>
      <ArcadeCard className="p-4 text-center">
        <Gamepad2 className="w-8 h-8 mx-auto text-[var(--secondary)] mb-2" />
        <div className="text-2xl font-bold">{stats.gamesCreated}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Games Created</div>
      </ArcadeCard>
      <ArcadeCard className="p-4 text-center">
        <Zap className="w-8 h-8 mx-auto text-[var(--primary)] mb-2" />
        <div className="text-2xl font-bold">{stats.promptRuns}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Prompt Runs</div>
      </ArcadeCard>
    </div>
  );
}
