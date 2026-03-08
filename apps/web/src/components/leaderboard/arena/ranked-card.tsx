"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import {
	Star,
	User,
	Play,
	Cpu,
	Gamepad2,
	Clock,
} from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { formatScore, formatPlayTime } from "@/lib/formatting";
import { getModelDetailRoute } from "@/lib/model-routes";
import { EntryActions } from "@/components/leaderboard/shared/entry-actions";
import { ShareDropdown } from "@/components/shared/share-dropdown";

const RANK_COLORS: Record<number, string> = {
	2: "from-slate-300 to-slate-500",
	3: "from-amber-600 to-amber-800",
	4: "from-zinc-400 to-zinc-600",
	5: "from-zinc-500 to-zinc-700",
};

function getRankColor(rank: number): string {
	return RANK_COLORS[rank] ?? "from-zinc-500 to-zinc-700";
}

type RankedCardVariant = "tall" | "compact";

export function RankedCard({
	entry,
	rank,
	variant = "tall",
}: {
	entry: LeaderboardEntry;
	rank: number;
	variant?: RankedCardVariant;
}) {
	const router = useRouter();

	const handlePlay = useCallback(() => {
		router.push(`/game/${entry.gameId}`);
	}, [router, entry.gameId]);

	const rankColor = getRankColor(rank);

	if (variant === "tall") {
		return (
			<ArcadeCard variant={rank <= 3 ? "glow" : "default"} className="overflow-hidden h-full">
				<div className="p-4 h-full flex flex-col">
					<div className="flex items-center gap-2 mb-3">
						<div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${rankColor} shadow-lg`}>
							<span className="text-lg font-bold text-white">{rank}</span>
						</div>
						{entry.tier && <ArcadeBadge text={entry.tier.slug} variant="default" />}
					</div>

					<Link
						href={`/game/${entry.gameId}`}
						className="block font-bold text-lg text-[var(--foreground)] hover:text-[var(--primary)] transition-colors mb-2 line-clamp-2"
					>
						{entry.gameName || "Untitled Game"}
					</Link>

					<div className="flex items-center gap-2 mb-2">
						<User className="h-3 w-3 text-[var(--muted-foreground)]" />
						<Link
							href={`/profile/${entry.creator.name}`}
							className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors truncate"
						>
							{entry.creator.name ?? "Anonymous"}
						</Link>
					</div>

					<div className="flex items-center gap-1 mb-2">
						<Link
							href={
								entry.modelId
									? getModelDetailRoute(entry.modelName, entry.modelId)
									: "/models"
							}
							className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
						>
							<Cpu className="h-3 w-3" />
							<span className="truncate">{entry.modelName}</span>
						</Link>
					</div>

					<div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-3">
						<div className="flex items-center gap-1">
							<Gamepad2 className="h-3 w-3" />
							<span>{entry.playCount}</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							<span>{formatPlayTime(entry.totalPlayTimeSeconds)}</span>
						</div>
					</div>

					<div className="flex items-center gap-2 mb-3 mt-auto">
						<Star className="h-4 w-4 text-[var(--primary)]" />
						<span className="text-xl font-bold text-[var(--primary)]">
							{formatScore(entry.finalScore)}
						</span>
						<span className="text-xs text-[var(--muted-foreground)]">pts</span>
					</div>

					<div className="flex flex-wrap gap-1">
						<ArcadeButton variant="primary" size="sm" className="gap-1 flex-1" onClick={handlePlay}>
							<Play className="h-3 w-3" />
							Play
						</ArcadeButton>
						<ShareDropdown
							url={`${process.env.NEXT_PUBLIC_APP_URL}/game/${entry.gameId}`}
							title={entry.gameName || "Play this game"}
						/>
						<EntryActions entry={entry} variant="compact" showFork={false} />
					</div>
				</div>
			</ArcadeCard>
		);
	}

	return (
		<ArcadeCard className="overflow-hidden h-full">
			<div className="p-3 h-full flex items-center gap-3">
				<div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${rankColor} shadow-lg shrink-0`}>
					<span className="text-sm font-bold text-white">{rank}</span>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<Link
							href={`/game/${entry.gameId}`}
							className="block font-semibold text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
						>
							{entry.gameName || "Untitled Game"}
						</Link>
						{entry.tier && <ArcadeBadge text={entry.tier.slug} variant="default" />}
					</div>
					<div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
						<Link
							href={`/profile/${entry.creator.name}`}
							className="hover:text-[var(--primary)] transition-colors truncate"
						>
							{entry.creator.name ?? "Anonymous"}
						</Link>
						<span className="text-[var(--primary)] font-bold">
							{formatScore(entry.finalScore)}
						</span>
					</div>
					<div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-0.5">
						<Link
							href={
								entry.modelId
									? getModelDetailRoute(entry.modelName, entry.modelId)
									: "/models"
							}
							className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors truncate"
						>
							<Cpu className="h-3 w-3" />
							<span className="truncate max-w-[80px]">{entry.modelName}</span>
						</Link>
						<div className="flex items-center gap-1">
							<Gamepad2 className="h-3 w-3" />
							<span>{entry.playCount}</span>
						</div>
					</div>
				</div>

				<ArcadeButton variant="outline" size="sm" onClick={handlePlay}>
					<Play className="h-4 w-4" />
				</ArcadeButton>
			</div>
		</ArcadeCard>
	);
}
