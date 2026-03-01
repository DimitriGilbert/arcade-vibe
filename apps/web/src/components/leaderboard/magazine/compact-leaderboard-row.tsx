"use client";

import Link from "next/link";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { Play } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { RankBadge } from "@/components/leaderboard/shared/rank-badge";
import { EntrySubtitle } from "@/components/leaderboard/shared/entry-subtitle";

export function CompactLeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
	const gameName = entry.gameName ?? "Untitled Game";
	const score = parseFloat(entry.finalScore) || 0;

	return (
		<div className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/20 transition-colors group">
			<RankBadge rank={rank} size="md" variant={rank <= 3 ? "medal" : "default"} />

			<div className="flex-1 min-w-0">
				<Link
					href={`/game/${entry.gameId}`}
					className="font-medium truncate group-hover:text-[var(--primary)] transition-colors block"
				>
					{gameName}
				</Link>
				<EntrySubtitle
					creator={{ name: entry.creator.name ?? "Anonymous" }}
					model={entry.modelId ? { id: entry.modelId, name: entry.modelName } : null}
					tier={entry.tier ? { slug: entry.tier.slug } : null}
					showLinks={true}
				/>
			</div>

			{entry.tier && (
				<ArcadeBadge text={entry.tier.slug} variant="default" className="shrink-0" />
			)}

			<div className="text-right shrink-0">
				<p className="font-bold">{score.toLocaleString()}</p>
				<p className="text-xs text-[var(--muted-foreground)]">pts</p>
			</div>

			<Link href={`/game/${entry.gameId}`}>
				<ArcadeButton variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
					<Play className="h-4 w-4" />
				</ArcadeButton>
			</Link>
		</div>
	);
}
