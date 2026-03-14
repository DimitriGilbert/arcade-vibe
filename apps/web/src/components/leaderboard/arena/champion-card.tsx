"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import {
	Trophy,
	Star,
	User,
	Play,
	Cpu,
	Calendar,
	Crown,
	Gamepad2,
	Clock,
} from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { formatScore, formatDateShort, formatPlayTime } from "@/lib/formatting";
import { getModelDetailRoute } from "@/lib/model-routes";
import { EntryActions } from "@/components/leaderboard/shared/entry-actions";
import { ShareDropdown } from "@/components/shared/share-dropdown";

export function ChampionCard({ entry }: { entry: LeaderboardEntry }) {
	const router = useRouter();

	const handlePlay = useCallback(() => {
		router.push(`/game/${entry.gameId}`);
	}, [router, entry.gameId]);

	return (
		<ArcadeCard variant="glow" className="overflow-hidden h-full">
			<div className="p-4 h-full flex flex-col">
				<div className="text-center mb-4">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-full border border-amber-500/30 mb-4">
						<Crown className="h-4 w-4 text-amber-500" />
						<span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
							Center Stage
						</span>
					</div>
				</div>

				<div className="text-center flex-1 flex flex-col justify-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/30 mb-4 mx-auto">
						<Trophy className="h-8 w-8 text-white" />
					</div>

					<Link
						href={`/game/${entry.gameId}`}
						className="block text-xl font-black text-[var(--foreground)] hover:text-[var(--primary)] transition-colors mb-2"
					>
						{entry.gameName || "Untitled Game"}
					</Link>

					<div className="flex items-center justify-center gap-2 mb-3">
						<User className="h-4 w-4 text-[var(--muted-foreground)]" />
						<Link
							href={`/profile/${entry.creator.name}`}
							className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors font-medium"
						>
							{entry.creator.name ?? "Anonymous"}
						</Link>
						{entry.tier && (
							<ArcadeBadge text={entry.tier.slug} variant="default" className="ml-2" />
						)}
					</div>

					<div className="flex flex-wrap gap-2 justify-center mb-4">
						<ArcadeButton variant="primary" size="sm" className="gap-1" onClick={handlePlay}>
							<Play className="h-4 w-4" />
							Play
						</ArcadeButton>
						<ShareDropdown
							url={`${process.env.NEXT_PUBLIC_APP_URL}/game/${entry.gameId}`}
							title={entry.gameName || "Play this game"}
						/>
						<EntryActions entry={entry} variant="full" showFork={false} />
					</div>

					<div className="inline-flex items-center gap-1 px-4 py-2 bg-[var(--primary)]/10 rounded-xl mb-3 mx-auto">
						<Star className="h-5 w-5 text-[var(--primary)]" />
						<span className="text-2xl font-black text-[var(--primary)]">
							{formatScore(entry.finalScore)}
						</span>
						<span className="text-sm text-[var(--muted-foreground)] ml-1">pts</span>
					</div>

					<div className="flex items-center justify-center gap-4 text-sm text-[var(--muted-foreground)] mb-3">
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
							<Calendar className="h-3 w-3" />
							<span>{formatDateShort(entry.submittedAt ?? entry.createdAt)}</span>
						</div>
					</div>

					<div className="flex items-center justify-center gap-3 text-xs text-[var(--muted-foreground)] mb-4">
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
		</div>
	</ArcadeCard>
	);
}
