"use client";

import Link from "next/link";
import {
	ArcadeCard,
	ArcadeBadge,
	ArcadeButton,
} from "@/components/arcade";
import {
	Gamepad2,
	User,
	Clock,
	Play,
} from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { formatPlayTime } from "@/lib/formatting";
import { getModelDetailRoute } from "@/lib/model-routes";
import { EntryActions } from "@/components/leaderboard/shared/entry-actions";
import { ShareDropdown } from "@/components/shared/share-dropdown";

const RANK_STYLES: Record<number, {
	container: string;
	badge: string;
	rankText: string;
}> = {
	1: {
		container: "bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/30",
		badge: "bg-yellow-500 text-yellow-950",
		rankText: "GOLD",
	},
	2: {
		container: "bg-gradient-to-br from-slate-400/10 via-slate-300/5 to-transparent border-slate-400/30",
		badge: "bg-slate-400 text-slate-950",
		rankText: "SILVER",
	},
	3: {
		container: "bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border-amber-600/30",
		badge: "bg-amber-600 text-amber-50",
		rankText: "BRONZE",
	},
};

export function CoverStoryCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
	const gameName = entry.gameName ?? "Untitled Game";
	const creator = entry.creator;
	const score = parseFloat(entry.finalScore) || 0;
	const style = RANK_STYLES[rank] ?? RANK_STYLES[1]!;

	return (
		<ArcadeCard variant={rank === 1 ? "glow" : "default"} className={`overflow-hidden ${style.container}`}>
			<div className="relative">
				<div className="absolute top-4 left-4 z-10">
					<span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
						{style.rankText}
					</span>
				</div>

				<div className="p-6 pt-14">
					<div className="flex items-start gap-4">
						<div className="w-16 h-16 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
							<Gamepad2 className="h-8 w-8 text-[var(--primary)]" />
						</div>

						<div className="flex-1 min-w-0">
							<h3 className="text-xl font-bold mb-1 line-clamp-1">{gameName}</h3>
							<div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
								<User className="h-3 w-3" />
								<Link
									href={`/profile/${creator.name}`}
									className="hover:text-[var(--primary)] transition-colors"
								>
									{creator.name ?? "Anonymous"}
								</Link>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2 mt-4">
						{entry.tier && (
							<ArcadeBadge text={entry.tier.name} variant="default" />
						)}
						{entry.theme && (
							<span className="text-xs text-[var(--muted-foreground)]">{entry.theme.title}</span>
						)}
					</div>

					<div className="flex items-center gap-6 mt-4">
						<div>
							<p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Score</p>
							<p className="text-2xl font-black text-[var(--primary)]">{score.toLocaleString()}</p>
						</div>
						<div>
							<p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Model</p>
							<Link
								href={
									entry.modelId
										? getModelDetailRoute(entry.modelName, entry.modelId)
										: "/models"
								}
								className="text-sm font-medium hover:text-[var(--primary)] transition-colors"
							>
								{entry.modelName}
							</Link>
						</div>
					</div>

					<div className="flex items-center gap-4 mt-4 text-xs text-[var(--muted-foreground)]">
						<div className="flex items-center gap-1">
							<Gamepad2 className="h-3 w-3" />
							<span>{entry.playCount} plays</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							<span>{formatPlayTime(entry.totalPlayTimeSeconds)}</span>
						</div>
					</div>

					<div className="flex flex-wrap gap-2 mt-6">
						<Link href={`/game/${entry.gameId}`} className="flex-1">
							<ArcadeButton variant="primary" className="w-full">
								<Play className="h-4 w-4" />
								Play
							</ArcadeButton>
						</Link>
						<ShareDropdown
							url={`${process.env.NEXT_PUBLIC_APP_URL}/game/${entry.gameId}`}
							title={entry.gameName ?? "Play this game"}
						/>
						<EntryActions
							entry={entry}
							variant="compact"
							showFork={false}
							showEmbed={true}
							showPrompt={true}
						/>
					</div>
				</div>
			</div>
		</ArcadeCard>
	);
}
