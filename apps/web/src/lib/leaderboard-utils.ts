/**
 * Shared leaderboard utilities for rank styling and display.
 */

export interface RankStyle {
	bg: string;
	text: string;
	border: string;
}

/**
 * Returns Tailwind CSS classes for rank badges.
 * - Rank 1 (Gold): Yellow
 * - Rank 2 (Silver): Slate
 * - Rank 3 (Bronze): Amber
 * - Others: Muted/default
 */
export function getRankStyle(rank: number): RankStyle {
	if (rank === 1) {
		return {
			bg: "bg-yellow-500/20",
			text: "text-yellow-600",
			border: "border-yellow-500/30",
		};
	}
	if (rank === 2) {
		return {
			bg: "bg-slate-400/20",
			text: "text-slate-500",
			border: "border-slate-400/30",
		};
	}
	if (rank === 3) {
		return {
			bg: "bg-amber-600/20",
			text: "text-amber-600",
			border: "border-amber-600/30",
		};
	}
	return {
		bg: "bg-[var(--muted)]/50",
		text: "text-[var(--muted-foreground)]",
		border: "border-[var(--border)]",
	};
}
