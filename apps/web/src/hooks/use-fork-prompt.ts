"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import type { LeaderboardEntry } from "@/lib/trpc-types";

/**
 * Hook to fork a prompt from a leaderboard entry.
 *
 * @param entry - The leaderboard entry containing game/prompt information
 * @returns An object with:
 *   - fork: Function to fork the prompt and navigate to workbench
 *   - isPending: Boolean indicating if a fork operation is in progress
 *
 * @example
 * ```tsx
 * const { fork, isPending } = useForkPrompt(entry);
 *
 * <button onClick={() => fork()} disabled={isPending}>
 *   Fork Prompt
 * </button>
 * ```
 */
export function useForkPrompt(entry: LeaderboardEntry) {
  const router = useRouter();

  const forkMutation = useMutation({
    mutationFn: async () => {
      const result = await trpcClient.prompts.fork.mutate({
        promptId: entry.promptId,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Prompt forked successfully!");
      router.push(`/creator/workbench?promptId=${data.promptId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  return {
    fork: () => forkMutation.mutate(),
    isPending: forkMutation.isPending,
  };
}
