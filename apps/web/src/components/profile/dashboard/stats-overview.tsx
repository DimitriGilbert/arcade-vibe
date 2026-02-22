"use client";

import { TrendingUp, Trophy, Target, Star } from "lucide-react";
import { MiniStat } from "@/components/profile/shared";
import type { GameWithRanking, Rating } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

export interface StatsOverviewProps {
  stats: ProfileStats;
  games: GameWithRanking[];
  ratings: Rating[];
}

export function StatsOverview({ stats, games, ratings }: StatsOverviewProps) {
  const rankedCount = games.filter((g) => g.ranking !== null).length;
  const topRank = games
    .filter((g) => g.ranking !== null)
    .reduce(
      (best, g) => (g.ranking && (!best || g.ranking < best) ? g.ranking : best),
      null as number | null
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MiniStat
        label="Reputation"
        value={stats.reputation}
        icon={TrendingUp}
        highlight
      />
      <MiniStat
        label="Best Rank"
        value={topRank ? `#${topRank}` : "NR"}
        icon={Trophy}
        highlight={topRank !== null && topRank <= 3}
      />
      <MiniStat label="Ranked Games" value={rankedCount} icon={Target} />
      <MiniStat label="Total Ratings" value={stats.totalRatings} icon={Star} />
    </div>
  );
}
