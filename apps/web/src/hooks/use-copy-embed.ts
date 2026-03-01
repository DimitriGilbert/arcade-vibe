"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateEmbedCode } from "@/lib/embed-utils";
import type { LeaderboardEntry } from "@/lib/trpc-types";

/**
 * Hook to copy embed code for a leaderboard entry game to clipboard.
 *
 * @param entry - The leaderboard entry containing game information
 * @returns An object with:
 *   - copyEmbed: Function to copy the embed code to clipboard
 *   - isCopying: Boolean indicating if a copy operation is in progress
 *
 * @example
 * ```tsx
 * const { copyEmbed, isCopying } = useCopyEmbed(entry);
 *
 * <button onClick={() => copyEmbed()} disabled={isCopying}>
 *   Copy Embed Code
 * </button>
 * ```
 */
export function useCopyEmbed(entry: LeaderboardEntry) {
  const copyMutation = useMutation({
    mutationFn: async () => {
      const embedCode = generateEmbedCode({
        gameId: entry.gameId,
        gameName: entry.gameName ?? undefined,
      });

      await navigator.clipboard.writeText(embedCode);
    },
    onSuccess: () => {
      toast.success("Embed code copied to clipboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to copy embed code");
    },
  });

  return {
    copyEmbed: () => copyMutation.mutate(),
    isCopying: copyMutation.isPending,
  };
}
