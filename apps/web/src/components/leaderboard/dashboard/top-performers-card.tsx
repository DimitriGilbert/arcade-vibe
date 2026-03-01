"use client";

import { useMemo } from "react";
import { ArcadeCard } from "@/components/arcade";
import { TrendingUp } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { formatScore } from "@/lib/formatting";
import { getRankStyle } from "@/lib/leaderboard-utils";

export function TopPerformersCard({ entries }: { entries: LeaderboardEntry[] }) {
	const top3 = useMemo(() => entries.slice(0, 3), [entries]);

	if (top3.length === 0) return null;

	return (
		<ArcadeCard className="p-3">
			<div className="flex items-center gap-2 mb-3">
				<TrendingUp className="h-4 w-4 text-[var(--primary)]" />
				<span className="text-xs font-semibold uppercase tracking-wide">Top Scores</span>
			</div>
			<div className="space-y-2">
				{top3.map((entry, idx) => {
					const rank = idx + 1;
					const score = parseFloat(entry.finalScore) || 0;
					const rankStyle = getRankStyle(rank);
					return (
						<div key={entry.gameId} className="flex items-center gap-2 text-sm">
							<span
								className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${rankStyle.bg} ${rankStyle.text}`}
							>
								{rank}
							</span>
							<span className="flex-1 truncate text-[var(--foreground)]">
								{entry.gameName || "Untitled"}
							</span>
							<span className="font-mono text-[var(--accent)]">{formatScore(score)}</span>
						</div>
					);
				})}
			</div>
		</ArcadeCard>
	);
}
