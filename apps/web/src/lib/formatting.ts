/**
 * Shared formatting utilities for leaderboard and game displays.
 * All functions are pure (no side effects) and handle null/undefined gracefully.
 */

/**
 * Formats a score with locale-specific formatting.
 * Returns "0" for NaN or zero values.
 */
export function formatScore(score: number | string): string {
	const num = typeof score === "string" ? parseFloat(score) : score;
	if (Number.isNaN(num) || num === 0) return "0";
	return num.toLocaleString();
}

/**
 * Formats a date as "Mon DD" (e.g., "Jan 15").
 * Returns empty string for null/undefined inputs.
 */
export function formatDateShort(date: Date | string | null): string {
	if (!date) return "";
	const d = new Date(date);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Converts seconds to a human-readable time format.
 * - Less than 60s: "Xs"
 * - Less than 1h: "Xm"
 * - 1h+: "Xh Ym"
 */
export function formatPlayTime(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	return `${hours}h ${mins}m`;
}

/**
 * Calculates and formats remaining time until an end date.
 * Returns "Ongoing" for null/undefined, "Ended" for past dates.
 * Formats as "Xd Yh left", "Xh left", or "Xm left".
 */
export function formatTimeRemaining(endDate: Date | string | null): string {
	if (!endDate) return "Ongoing";
	const end = new Date(endDate);
	const now = new Date();
	const diff = end.getTime() - now.getTime();
	if (diff <= 0) return "Ended";
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	if (days > 0) return `${days}d ${hours}h left`;
	if (hours > 0) return `${hours}h left`;
	const mins = Math.floor(diff / (1000 * 60));
	return `${mins}m left`;
}
