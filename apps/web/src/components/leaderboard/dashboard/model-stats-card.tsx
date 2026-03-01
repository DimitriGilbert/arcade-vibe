"use client";

import { useMemo } from "react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { Cpu } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";

export function ModelStatsCard({ entries }: { entries: LeaderboardEntry[] }) {
	const modelCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		entries.forEach((entry) => {
			if (entry.modelName) {
				counts[entry.modelName] = (counts[entry.modelName] ?? 0) + 1;
			}
		});
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	}, [entries]);

	if (modelCounts.length === 0) return null;

	return (
		<ArcadeCard className="p-3">
			<div className="flex items-center gap-2 mb-3">
				<Cpu className="h-4 w-4 text-[var(--primary)]" />
				<span className="text-xs font-semibold uppercase tracking-wide">Models</span>
			</div>
			<div className="space-y-1.5">
				{modelCounts.map(([model, count]) => (
					<div key={model} className="flex items-center justify-between text-xs">
						<span className="truncate flex-1 mr-2">{model}</span>
						<ArcadeBadge text={`${count}`} variant="default" />
					</div>
				))}
			</div>
		</ArcadeCard>
	);
}
