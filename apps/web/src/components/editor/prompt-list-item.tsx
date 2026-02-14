import { cn } from "@/lib/utils";
import { ArcadeBadge } from "@/components/arcade";

interface PromptListItemProps {
  id: string;
  content: string;
  version: number;
  updatedAt: Date | string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  }
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

/**
 * Truncates content to a maximum length with ellipsis
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength).trim()}...`;
}

export function PromptListItem({
  content,
  version,
  updatedAt,
  isActive,
  onClick,
}: PromptListItemProps): React.ReactElement {
  const displayContent = truncateContent(content, 60);
  const relativeTime = formatRelativeTime(updatedAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-[var(--radius)] transition-all duration-200 cursor-pointer",
        "hover:bg-[var(--muted)]/50",
        "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
        isActive && "bg-[var(--muted)] border-l-2 border-[var(--primary)]"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm text-[var(--foreground)] line-clamp-2 flex-1">
          {displayContent}
        </p>
        <ArcadeBadge
          text={`v${version}`}
          variant={isActive ? "neon" : "default"}
          className="shrink-0"
        />
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">{relativeTime}</p>
    </button>
  );
}
