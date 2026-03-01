"use client";

import Link from "next/link";
import { Code, FileText } from "lucide-react";
// GitFork import kept for future re-enablement of fork functionality
// import { GitFork } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { useCopyEmbed } from "@/hooks/use-copy-embed";
import type { LeaderboardEntry } from "@/lib/trpc-types";

/**
 * Props for the EntryActions component
 */
export interface EntryActionsProps {
  /** The leaderboard entry containing game information */
  entry: LeaderboardEntry;
  /** Display variant affecting button arrangement and visibility */
  variant?: "full" | "compact" | "hover";
  /** Whether to show the fork button */
  showFork?: boolean;
  /** Whether to show the embed button */
  showEmbed?: boolean;
  /** Whether to show the prompt button */
  showPrompt?: boolean;
}

/**
 * EntryActions provides action buttons for a leaderboard entry.
 *
 * Supports fork, embed, and prompt actions with configurable visibility.
 * The fork button is temporary and will be removed in Phase 7.
 *
 * @example
 * ```tsx
 * // Full variant with all actions
 * <EntryActions entry={entry} variant="full" />
 *
 * // Compact variant with hover behavior
 * <EntryActions entry={entry} variant="hover" showFork={false} />
 * ```
 */
export function EntryActions({
  entry,
  variant = "full",
  showFork = false,
  showEmbed = true,
  showPrompt = true,
}: EntryActionsProps) {
  const { copyEmbed, isCopying } = useCopyEmbed(entry);

  // Check if prompt should be visible
  // Prompt is shown when visibility is "public" or "public_on_freeze"
  const isPromptVisible =
    entry.promptVisibility === "public" ||
    entry.promptVisibility === "public_on_freeze";

  // Determine visibility classes based on variant
  const containerClasses =
    variant === "hover"
      ? "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      : "flex flex-wrap gap-2";

  const buttonSize = variant === "compact" ? "sm" : "sm";

  return (
    <div className={containerClasses}>
      {/* TODO: Fork button hidden - functionality will be re-enabled in future phase
          {showFork && (
            <ArcadeButton
              variant="outline"
              size={buttonSize}
              onClick={() => {
                console.warn("Fork action not implemented - will be removed in Phase 7");
              }}
              aria-label="Fork prompt"
            >
              <GitFork className="h-4 w-4" />
            </ArcadeButton>
          )}
      */}

      {showEmbed && (
        <ArcadeButton
          variant="outline"
          size={buttonSize}
          onClick={copyEmbed}
          disabled={isCopying}
          aria-label={isCopying ? "Copying embed code..." : "Copy embed code"}
        >
          <Code className="h-4 w-4" />
        </ArcadeButton>
      )}

      {showPrompt && isPromptVisible && (
        <Link href={`/prompts/document/${entry.promptId}`}>
          <ArcadeButton
            variant="outline"
            size={buttonSize}
            aria-label="View prompt"
          >
            <FileText className="h-4 w-4" />
          </ArcadeButton>
        </Link>
      )}
    </div>
  );
}
