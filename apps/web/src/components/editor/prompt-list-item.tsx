import { cn } from "@/lib/utils";
import { ArcadeBadge } from "@/components/arcade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Globe, Lock } from "lucide-react";
import type { Visibility } from "@/lib/trpc-types";

interface PromptListItemProps {
  id: string;
  title: string | null;
  content: string;
  version: number;
  updatedAt: Date | string;
  visibility?: Visibility;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onToggleVisibility?: (id: string, visibility: Visibility) => void;
  isDeleting?: boolean;
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
  id,
  title,
  content,
  version,
  updatedAt,
  visibility = "private",
  isActive,
  onClick,
  onDelete,
  onToggleVisibility,
  isDeleting = false,
}: PromptListItemProps): React.ReactElement {
  // Display title if available, otherwise fall back to truncated content
  const displayContent = title && title.trim().length > 0
    ? title
    : truncateContent(content, 50);
  const relativeTime = formatRelativeTime(updatedAt);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisibility: Visibility = visibility === "private" ? "public" : "private";
    onToggleVisibility?.(id, newVisibility);
  };

  return (
    <div
      className={cn(
        "w-full text-left p-3 rounded-[var(--radius)] transition-all duration-200 group relative",
        "hover:bg-[var(--muted)]/50",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--ring)]",
        isActive && "bg-[var(--muted)] border-l-2 border-[var(--primary)]"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus:outline-none"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm text-[var(--foreground)] line-clamp-2 flex-1">
            {displayContent}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <ArcadeBadge
              text={`v${version}`}
              variant={isActive ? "neon" : "default"}
            />
            {visibility === "public" && (
              <Globe className="h-3 w-3 text-green-500" />
            )}
            {visibility === "private" && (
              <Lock className="h-3 w-3 text-[var(--muted-foreground)]" />
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">{relativeTime}</p>
      </button>

      {(onDelete || onToggleVisibility) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--muted)] focus:opacity-100"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={handleToggleVisibility}
              disabled={isDeleting}
            >
              {visibility === "private" ? (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Make Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Make Private
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
