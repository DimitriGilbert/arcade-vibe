"use client";

import Link from "next/link";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import {
	User,
	Play,
	Cpu,
	Gamepad2,
	Clock,
} from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { formatScore, formatPlayTime } from "@/lib/formatting";
import { getModelDetailRoute } from "@/lib/model-routes";
import { RankBadge } from "@/components/leaderboard/shared/rank-badge";
import { EntryActions } from "@/components/leaderboard/shared/entry-actions";
import { ShareDropdown } from "@/components/shared/share-dropdown";

export function ChallengerRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
	const isPodium = rank <= 3;

	return (
		<div
			className={`flex items-center gap-4 p-4 hover:bg-[var(--muted)]/30 transition-colors group ${
				isPodium ? "bg-[var(--accent)]/5" : ""
			}`}
		>
			<div className="w-12 flex-shrink-0 text-center">
				<RankBadge rank={rank} size="sm" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<Link
						href={`/game/${entry.gameId}`}
						className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
					>
						{entry.gameName || "Untitled Game"}
					</Link>
					<Link
						href={`/game/${entry.gameId}`}
						className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
					>
						<Play className="h-4 w-4 text-[var(--primary)]" />
					</Link>
					{entry.tier && (
						<ArcadeBadge text={entry.tier.slug} variant="default" />
					)}
				</div>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
					<div className="flex items-center gap-1">
						<User className="h-3 w-3" />
						<Link
							href={`/profile/${entry.creator.name}`}
							className="hover:text-[var(--primary)] transition-colors"
						>
							{entry.creator.name ?? "Anonymous"}
						</Link>
					</div>
					<Link
						href={
							entry.modelId
								? getModelDetailRoute(entry.modelName, entry.modelId)
								: "/models"
						}
						className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
					>
						<Cpu className="h-3 w-3" />
						<span className="truncate max-w-[100px]">{entry.modelName}</span>
					</Link>
					<div className="flex items-center gap-1">
						<Gamepad2 className="h-3 w-3" />
						<span>{entry.playCount} plays</span>
					</div>
					<div className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						<span>{formatPlayTime(entry.totalPlayTimeSeconds)}</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<div className="text-right">
					<div className="font-bold text-lg text-[var(--foreground)] font-mono">
						{formatScore(entry.finalScore)}
					</div>
					<div className="text-xs text-[var(--muted-foreground)]">pts</div>
				</div>
			</div>

			<div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
				<ShareDropdown
					url={`${process.env.NEXT_PUBLIC_APP_URL}/game/${entry.gameId}`}
					title={entry.gameName || "Play this game"}
				/>
				<EntryActions entry={entry} variant="hover" showFork={false} />
			</div>
		</div>
	);
}
