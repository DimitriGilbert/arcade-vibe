"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Gamepad2,
  GitFork,
  Play,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { ArcadeBadge, ArcadeCard, ArcadeButton, ArcadeTabs, ArcadeTabsList, ArcadeTabsTrigger, ArcadeTabsContent } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import UserAvatar from "@/components/reusable/user-avatar";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";

interface DocumentEditorClientProps {
  promptId: string;
}

export default function DocumentEditorClient({ promptId }: DocumentEditorClientProps) {
  const { data: session } = authClient.useSession();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: prompt, isLoading: isPromptLoading, error } = useQuery({
    queryKey: ["prompts", "public", promptId],
    queryFn: async () => {
      return await trpcClient.prompts.getPublicById.query({ id: promptId });
    },
  });

  const { data: gamesData, isLoading: isGamesLoading } = useQuery({
    queryKey: ["prompts", "games", promptId],
    queryFn: async () => {
      return await trpcClient.prompts.listGamesByPrompt.query({ promptId });
    },
    enabled: !!prompt,
  });

  const { data: forks, isLoading: isForksLoading } = useQuery({
    queryKey: ["prompts", "forks", promptId],
    queryFn: async () => {
      return await trpcClient.prompts.listForksByPrompt.query({ promptId });
    },
    enabled: !!prompt,
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.prompts.fork.mutate({ promptId });
    },
    onSuccess: () => {
      toast.success("Prompt forked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  const topRatedGame = useMemo(() => {
    if (!gamesData?.items || gamesData.items.length === 0) return null;
    return [...gamesData.items].sort((a, b) => b.avgRating - a.avgRating)[0] ?? null;
  }, [gamesData?.items]);

  const handleCopyPrompt = useCallback(() => {
    if (prompt?.content) {
      navigator.clipboard.writeText(prompt.content);
      toast.success("Prompt copied to clipboard");
    }
  }, [prompt?.content]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }, []);

  if (isPromptLoading) {
    return <LoadingState centered message="Loading prompt..." />;
  }

  if (error || !prompt) {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState title="Prompt not found" message="This prompt does not exist or is not public." />
      </div>
    );
  }

  const truncatedContent = prompt.title
    ? prompt.title
    : prompt.content.length > 200
      ? prompt.content.slice(0, 200) + "..."
      : prompt.content;
  const displayContent = isExpanded ? prompt.content : truncatedContent;

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="container mx-auto px-4 pt-8 space-y-6 max-w-4xl">
        <Link
          href={"/prompts/document" as Route}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prompts
        </Link>

        <ArcadeCard className="p-6">
          <div className="flex items-start gap-4">
            <UserAvatar
              user={prompt.author ?? undefined}
              size="lg"
              variant="gradient"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold truncate">
                  {prompt.author?.name ?? "Anonymous"}'s Prompt
                </h1>
                {prompt.theme && (
                  <ArcadeBadge text={prompt.theme.title} variant="default" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--muted-foreground)]">
                <span>{prompt.tokenCount} tokens</span>
                <span>v{prompt.version}</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(prompt.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <pre className="whitespace-pre-wrap text-sm bg-[var(--muted)]/30 rounded-md p-4 border border-[var(--border)] max-h-[300px] overflow-auto">
                {displayContent}
              </pre>
            </div>
            {prompt.content.length > 200 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {topRatedGame && (
              <Link href={`/game/${topRatedGame.id}` as Route}>
                <ArcadeButton variant="primary">
                  <Play className="h-4 w-4" />
                  Play Best Game
                </ArcadeButton>
              </Link>
            )}
            {session?.user && (
              <ArcadeButton
                variant="outline"
                onClick={() => forkMutation.mutate()}
                disabled={forkMutation.isPending}
              >
                <GitFork className="h-4 w-4" />
                Fork
              </ArcadeButton>
            )}
            <ArcadeButton variant="outline" onClick={handleCopyPrompt}>
              <Copy className="h-4 w-4" />
              Copy Prompt
            </ArcadeButton>
            <ArcadeButton variant="outline" onClick={handleShare}>
              Share
            </ArcadeButton>
          </div>
        </ArcadeCard>

        <div className="grid grid-cols-3 gap-4">
          <ArcadeCard className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
              <Gamepad2 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Games</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{prompt.stats.gameCount}</p>
          </ArcadeCard>
          <ArcadeCard className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
              <GitFork className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Forks</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{prompt.stats.forkCount}</p>
          </ArcadeCard>
          <ArcadeCard className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
              <Star className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Avg Rating</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {prompt.stats.avgRating > 0 ? prompt.stats.avgRating.toFixed(1) : "-"}
            </p>
          </ArcadeCard>
        </div>

        <ArcadeTabs defaultValue="games">
          <ArcadeTabsList variant="line">
            <ArcadeTabsTrigger variant="line" value="games">
              <Gamepad2 className="h-4 w-4" />
              Games ({prompt.stats.gameCount})
            </ArcadeTabsTrigger>
            <ArcadeTabsTrigger variant="line" value="forks">
              <GitFork className="h-4 w-4" />
              Forks ({prompt.stats.forkCount})
            </ArcadeTabsTrigger>
          </ArcadeTabsList>

          <ArcadeTabsContent value="games">
            {isGamesLoading ? (
              <ArcadeCard className="p-8">
                <LoadingState message="Loading games..." />
              </ArcadeCard>
            ) : !gamesData?.items || gamesData.items.length === 0 ? (
              <ArcadeCard className="p-10">
                <EmptyState
                  title="No games yet"
                  message="No public games have been created with this prompt."
                />
              </ArcadeCard>
            ) : (
              <div className="space-y-3">
                {gamesData.items.map((game) => (
                  <ArcadeCard
                    key={game.id}
                    className="p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/game/${game.id}` as Route}
                          className="font-semibold hover:text-[var(--primary)] line-clamp-1"
                        >
                          {game.name || "Untitled Game"}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                          {game.theme?.title && (
                            <span>Theme: {game.theme.title}</span>
                          )}
                          {game.tier?.name && (
                            <span>Tier: {game.tier.name}</span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(game.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-[var(--muted-foreground)]">Rating</p>
                          <p className="font-bold">
                            {game.avgRating > 0 ? game.avgRating.toFixed(1) : "-"}
                          </p>
                        </div>
                        {game.highScore !== null && (
                          <div className="text-right">
                            <p className="text-xs text-[var(--muted-foreground)]">High Score</p>
                            <p className="font-bold">{game.highScore.toLocaleString()}</p>
                          </div>
                        )}
                        <Link href={`/game/${game.id}` as Route}>
                          <ArcadeButton variant="primary" size="sm">
                            <Play className="h-3.5 w-3.5" />
                            Play
                          </ArcadeButton>
                        </Link>
                        {session?.user && (
                          <ArcadeButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              trpcClient.prompts.fork.mutate({ promptId });
                              toast.success("Prompt forked");
                            }}
                          >
                            <GitFork className="h-3.5 w-3.5" />
                            Fork
                          </ArcadeButton>
                        )}
                      </div>
                    </div>
                  </ArcadeCard>
                ))}
              </div>
            )}
          </ArcadeTabsContent>

          <ArcadeTabsContent value="forks">
            {isForksLoading ? (
              <ArcadeCard className="p-8">
                <LoadingState message="Loading forks..." />
              </ArcadeCard>
            ) : !forks || forks.length === 0 ? (
              <ArcadeCard className="p-10">
                <EmptyState
                  title="No forks yet"
                  message="No one has forked this prompt yet."
                />
              </ArcadeCard>
            ) : (
              <div className="space-y-3">
                {forks.map((fork) => (
                  <ArcadeCard
                    key={fork.id}
                    className="p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/20"
                  >
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        user={fork.author ?? undefined}
                        size="md"
                        variant="gradient"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {fork.author?.name ?? "Anonymous"}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">
                          {fork.contentPreview}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-[var(--muted-foreground)]">
                          {new Date(fork.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {fork.gameCount} game{fork.gameCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </ArcadeCard>
                ))}
              </div>
            )}
          </ArcadeTabsContent>
        </ArcadeTabs>
      </div>
    </div>
  );
}
