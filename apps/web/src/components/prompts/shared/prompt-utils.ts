/**
 * @fileoverview Utility functions for prompts components
 */

/**
 * Formats a rating value for display
 * Returns "N/A" for zero ratings
 */
export function formatRating(rating: number): string {
  if (rating === 0) return "N/A";
  return rating.toFixed(1);
}

/**
 * Formats a date to a short readable format
 * Returns "Jan 15" style format
 */
export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
