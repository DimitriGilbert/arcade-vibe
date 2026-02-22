"use client";

import type { PromptGetPublicByIdOutput, PromptListGamesByPromptOutput, PromptListForksByPromptOutput } from "@/lib/trpc-types";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { trpcClient } from "@/utils/trpc";

type GameItem = PromptListGamesByPromptOutput["items"][number];

interface UseGalleryDataResult {
  prompt: PromptGetPublicByIdOutput | undefined;
  gamesData: { items: GameItem[] } | undefined;
  forks: PromptListForksByPromptOutput | undefined;
  top3: GameItem[];
  rest: GameItem[];
  isPromptLoading: boolean;
  isGamesLoading: boolean;
  isForksLoading: boolean;
  isForking: boolean;
  handleFork: () => void;
  handleShare: () => void;
}

export function useGalleryData(promptId: string, initialPrompt?: PromptGetPublicByIdOutput): UseGalleryDataResult {
  const { data: prompt, isLoading: isPromptLoading } = useQuery({
    queryKey: ["prompts", "getPublicById", promptId],
    queryFn: async () => {
      return await trpcClient.prompts.getPublicById.query({ id: promptId });
    },
    initialData: initialPrompt,
  });

  const { data: gamesData, isLoading: isGamesLoading } = useQuery({
    queryKey: ["prompts", "listGamesByPrompt", promptId],
    queryFn: async () => {
      return await trpcClient.prompts.listGamesByPrompt.query({ promptId, limit: 100 });
    },
  });

  const { data: forks, isLoading: isForksLoading } = useQuery({
    queryKey: ["prompts", "listForksByPrompt", promptId],
    queryFn: async () => {
      return await trpcClient.prompts.listForksByPrompt.query({ promptId, limit: 20 });
    },
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.prompts.fork.mutate({ promptId });
    },
    onSuccess: (data) => {
      toast.success("Prompt forked! Redirecting to your dashboard...");
      setTimeout(() => {
        window.location.href = `/prompts/dashboard/${data.promptId}`;
      }, 1000);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  }, []);

  const { top3, rest } = useMemo(() => {
    if (!gamesData?.items) return { top3: [], rest: [] };

    const sortedByScore = [...gamesData.items]
      .filter((g): g is GameItem & { highScore: number } => g.highScore !== null)
      .sort((a, b) => b.highScore - a.highScore);

    return {
      top3: sortedByScore.slice(0, 3),
      rest: sortedByScore.slice(3),
    };
  }, [gamesData?.items]);

  const handleFork = useCallback(() => {
    forkMutation.mutate();
  }, [forkMutation]);

  return {
    prompt,
    gamesData,
    forks,
    top3,
    rest,
    isPromptLoading,
    isGamesLoading,
    isForksLoading,
    isForking: forkMutation.isPending,
    handleFork,
    handleShare,
  };
}
