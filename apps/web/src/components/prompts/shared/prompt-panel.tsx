"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Gamepad2, GitFork, Loader2, Play, Star, User } from "lucide-react";

import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { trpcClient } from "@/utils/trpc";
import type { PromptGetPublicByIdOutput } from "@/lib/trpc-types";

import { formatDateShort, formatRating } from "./prompt-utils";

export interface PromptPanelProps {
  prompt: PromptGetPublicByIdOutput | undefined;
  isLoading: boolean;
}

export function PromptPanel({ prompt, isLoading }: PromptPanelProps) {
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);

  const handleFork = useCallback(async () => {
    if (!prompt) return;
    setIsForking(true);
    try {
      const result = await trpcClient.prompts.fork.mutate({
        promptId: prompt.id,
      });
      toast.success("Prompt forked successfully!");
      router.push(`/creator/workbench?promptId=${result.promptId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fork prompt");
    } finally {
      setIsForking(false);
    }
  }, [prompt, router]);

  const handleShare = useCallback(async () => {
    if (!prompt) return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [prompt]);

  const handlePlayBest = useCallback(() => {
    if (!prompt) return;
    router.push(`/game/${prompt.id}`);
  }, [prompt, router]);

  if (isLoading || !prompt) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-[var(--muted)] rounded w-3/4" />
        <div className="h-4 bg-[var(--muted)] rounded w-1/2" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-[var(--muted)] rounded" />
          <div className="h-3 bg-[var(--muted)] rounded" />
          <div className="h-3 bg-[var(--muted)] rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2">
          <ArcadeBadge text={`v${prompt.version}`} variant="default" />
          <ArcadeBadge text={prompt.visibility} variant="default" />
        </div>
        <h1 className="text-lg font-bold line-clamp-2">
          {prompt.theme?.title ?? "Prompt"}
        </h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-[var(--muted-foreground)]">
          <User className="h-3.5 w-3.5" />
          <span>{prompt.author?.name ?? "Anonymous"}</span>
          <span className="text-[var(--border)]">•</span>
          <span>{formatDateShort(prompt.createdAt)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Prompt
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {prompt.tokenCount} tokens
          </span>
        </div>
        <pre className="text-sm whitespace-pre-wrap font-mono bg-[var(--muted)]/30 p-3 rounded-lg border border-[var(--border)] text-[var(--foreground)]">
          {prompt.content}
        </pre>
      </div>

      <div className="p-4 border-t border-[var(--border)] space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-[var(--muted)]/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-[var(--primary)] mb-1">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{prompt.stats.gameCount}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Games</p>
          </div>
          <div className="p-2 bg-[var(--muted)]/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-[var(--primary)] mb-1">
              <GitFork className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{prompt.stats.forkCount}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Forks</p>
          </div>
          <div className="p-2 bg-[var(--muted)]/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-[var(--primary)] mb-1">
              <Star className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{formatRating(prompt.stats.avgRating)}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Avg</p>
          </div>
        </div>

        <div className="space-y-2">
          <ArcadeButton
            variant="primary"
            className="w-full gap-2"
            onClick={handlePlayBest}
            disabled={prompt.stats.gameCount === 0}
          >
            <Play className="h-4 w-4" />
            Play Best Game
          </ArcadeButton>
          <div className="grid grid-cols-2 gap-2">
            <ArcadeButton
              variant="outline"
              className="gap-2"
              onClick={handleFork}
              disabled={isForking}
            >
              {isForking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitFork className="h-4 w-4" />
              )}
              Fork
            </ArcadeButton>
            <ArcadeButton
              variant="outline"
              className="gap-2"
              onClick={handleShare}
            >
              <Copy className="h-4 w-4" />
              Share
            </ArcadeButton>
          </div>
        </div>
      </div>
    </div>
  );
}
