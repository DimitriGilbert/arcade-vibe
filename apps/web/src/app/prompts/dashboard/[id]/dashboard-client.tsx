"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import {
  Copy,
  Gamepad2,
  GitFork,
  Loader2,
  Play,
  Star,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { RouterOutput } from "@/lib/trpc-types";

type PublicPrompt = RouterOutput["prompts"]["getPublicById"];
type PromptGame = RouterOutput["prompts"]["listGamesByPrompt"]["items"][number];
type PromptFork = RouterOutput["prompts"]["listForksByPrompt"][number];

interface PromptDashboardClientProps {
  promptId: string;
  initialData?: PublicPrompt;
}

const PAGE_SIZE = 30;

function formatRating(rating: number): string {
  if (rating === 0) return "N/A";
  return rating.toFixed(1);
}

function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PromptPanel({
  prompt,
  isLoading,
}: {
  prompt: PublicPrompt | undefined;
  isLoading: boolean;
}) {
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

function GamesList({
  games,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  games: PromptGame[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}) {
  if (isLoading) {
    const skeletonIds = Array.from({ length: 6 }, (_, i) => `sk-${i}`);
    return (
      <div className="space-y-3 animate-pulse">
        {skeletonIds.map((id) => (
          <div
            key={id}
            className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg"
          >
            <div className="w-8 h-8 bg-[var(--muted)] rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-1/3 bg-[var(--muted)] rounded" />
              <div className="h-2.5 w-1/4 bg-[var(--muted)] rounded" />
            </div>
            <div className="w-16 h-5 bg-[var(--muted)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-8 text-center">
        <Gamepad2 className="h-12 w-12 mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
        <p className="text-[var(--muted-foreground)]">No games yet</p>
        <Link href="/login">
          <ArcadeButton variant="primary" size="sm" className="mt-4">
            Create First Game
          </ArcadeButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game, idx) => (
        <Link
          key={game.id}
          href={`/game/${game.id}`}
          className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors group"
        >
          <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-[var(--muted)] rounded-lg">
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                {game.name || "Untitled Game"}
              </span>
              {game.isSubmitted && (
                <ArcadeBadge text="Submitted" variant="neon" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
              <span className="truncate max-w-[120px]">{game.modelName}</span>
              <span className="text-[var(--border)]">•</span>
              <span>{formatDateShort(game.createdAt)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {game.highScore !== null && (
              <p className="text-sm font-bold text-[var(--accent)]">
                {game.highScore.toLocaleString()}
              </p>
            )}
            {game.ratingCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Star className="h-3 w-3" />
                <span>{formatRating(game.avgRating)}</span>
              </div>
            )}
          </div>
          <Play className="h-4 w-4 text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>
      ))}

      {hasMore && (
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="w-full gap-2"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </ArcadeButton>
      )}
    </div>
  );
}

function ForksList({ forks }: { forks: PromptFork[] }) {
  if (forks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {forks.map((fork) => (
        <Link
          key={fork.id}
          href={`/prompts/dashboard/${fork.id}`}
          className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--primary)]/10 rounded-lg">
            <Users className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm truncate">
              {fork.author?.name ?? "Anonymous"}
            </span>
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
              {fork.contentPreview}
              {fork.contentPreview.length >= 150 && "..."}
            </p>
          </div>
          <ArcadeBadge text={`${fork.gameCount} games`} variant="default" />
        </Link>
      ))}
    </div>
  );
}

export function PromptDashboardClient({
  promptId,
  initialData,
}: PromptDashboardClientProps) {
  const [allGames, setAllGames] = useState<PromptGame[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: prompt, isLoading: promptLoading } = useQuery({
    queryKey: ["prompt-public", promptId],
    queryFn: () => trpcClient.prompts.getPublicById.query({ id: promptId }),
    initialData,
  });

  const { isLoading: gamesLoading } = useQuery({
    queryKey: ["prompt-games", promptId],
    queryFn: async () => {
      const result = await trpcClient.prompts.listGamesByPrompt.query({
        promptId,
        limit: PAGE_SIZE,
      });
      setAllGames(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
      return result;
    },
  });

  const { data: forks } = useQuery({
    queryKey: ["prompt-forks", promptId],
    queryFn: () =>
      trpcClient.prompts.listForksByPrompt.query({
        promptId,
        limit: 20,
      }),
  });

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !cursor) return;

    setIsLoadingMore(true);
    try {
      const result = await trpcClient.prompts.listGamesByPrompt.query({
        promptId,
        limit: PAGE_SIZE,
        cursor,
      });
      setAllGames((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, promptId]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0">
          <aside className="lg:col-span-3 lg:sticky lg:top-0 lg:h-screen border-r border-[var(--border)] bg-[var(--card)]">
            <PromptPanel prompt={prompt} isLoading={promptLoading} />
          </aside>

          <main className="lg:col-span-9 p-4 lg:p-6 min-h-screen lg:max-h-screen lg:overflow-y-auto">
            <div className="space-y-6">
              <ArcadeCard>
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold">Games</h2>
                    {prompt && (
                      <span className="text-sm text-[var(--muted-foreground)]">
                        ({prompt.stats.gameCount})
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <GamesList
                    games={allGames}
                    isLoading={gamesLoading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                  />
                </div>
              </ArcadeCard>

              {forks && forks.length > 0 && (
                <ArcadeCard>
                  <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <GitFork className="h-5 w-5 text-[var(--primary)]" />
                      <h2 className="text-lg font-semibold">Forks</h2>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        ({forks.length})
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <ForksList forks={forks} />
                  </div>
                </ArcadeCard>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
