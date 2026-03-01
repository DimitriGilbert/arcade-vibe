import { getRankStyle } from "@/lib/leaderboard-utils";

export interface RankBadgeProps {
	rank: number;
	size?: "sm" | "md" | "lg";
	variant?: "default" | "gradient" | "medal";
}

const sizeClasses: Record<NonNullable<RankBadgeProps["size"]>, string> = {
	sm: "text-xs p-1",
	md: "text-sm p-1.5",
	lg: "text-base p-2",
};

const gradientColors: Record<number, string> = {
	1: "from-yellow-400 to-amber-500",
	2: "from-slate-300 to-slate-500",
	3: "from-amber-600 to-amber-800",
};

const medalIcons: Record<number, string> = {
	1: "🥇",
	2: "🥈",
	3: "🥉",
};

/**
 * RankBadge component for displaying leaderboard positions.
 * Supports three visual variants and three sizes.
 *
 * @param rank - The position number to display
 * @param size - Size variant: "sm", "md", or "lg"
 * @param variant - Visual style: "default", "gradient", or "medal"
 */
export function RankBadge({
	rank,
	size = "md",
	variant = "default",
}: RankBadgeProps): React.ReactNode {
	const rankStyle = getRankStyle(rank);
	const sizeClass = sizeClasses[size];

	if (variant === "medal" && rank >= 1 && rank <= 3) {
		const medal = medalIcons[rank];
		if (medal !== undefined) {
			return (
				<span
					role="img"
					aria-label={`Rank ${rank}`}
					className={`inline-flex items-center justify-center ${sizeClass}`}
				>
					{medal}
				</span>
			);
		}
	}

	if (variant === "gradient" && rank >= 1 && rank <= 3) {
		const gradient = gradientColors[rank];
		if (gradient !== undefined) {
			return (
				<span
					role="img"
					aria-label={`Rank ${rank}`}
					className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-lg ${sizeClass} font-bold text-white`}
				>
					{rank}
				</span>
			);
		}
	}

	return (
		<span
			role="img"
			aria-label={`Rank ${rank}`}
			className={`inline-flex items-center justify-center rounded-full border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border} font-bold ${sizeClass}`}
		>
			{rank}
		</span>
	);
}
