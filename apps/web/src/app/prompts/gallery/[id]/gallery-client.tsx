"use client";

import type { PromptGetPublicByIdOutput, PromptListGamesByPromptOutput, PromptListForksByPromptOutput } from "@/lib/trpc-types";
import type { Route } from "next";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Gamepad2,
  GitFork,
  Share2,
  Trophy,
  Star,
  Play,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";

type GameItem = PromptListGamesByPromptOutput["items"][number];
type ForkItem = PromptListForksByPromptOutput[number];

interface GalleryClientProps {
  promptId: string;
  initialPrompt?: PromptGetPublicByIdOutput;
}

export default function GalleryClient({ promptId, initialPrompt }: GalleryClientProps) {
  const { data: session } = authClient.useSession();

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
      .filter((g) => g.highScore !== null)
      .sort((a, b) => (b.highScore ?? 0) - (a.highScore ?? 0));

    return {
      top3: sortedByScore.slice(0, 3),
      rest: sortedByScore.slice(3),
    };
  }, [gamesData?.items]);

  if (isPromptLoading) {
    return (
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <LoadingState size="lg" centered message="Loading prompt gallery..." />
        </div>
      </main>
    );
  }

  if (!prompt) {
    return (
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <EmptyState title="Prompt not found" message="This prompt does not exist or is not public." />
        </div>
      </main>
    );
  }

  const contentPreview = prompt.content.length > 150
    ? `${prompt.content.slice(0, 150)}...`
    : prompt.content;

  return (
    <main className="min-h-screen bg-background pb-12">
      <HeroSection
        contentPreview={contentPreview}
        author={prompt.author}
        theme={prompt.theme}
        stats={prompt.stats}
        onPlayBest={top3[0] ? () => { window.location.href = `/game/${top3[0].id}`; } : undefined}
        onFork={() => forkMutation.mutate()}
        onShare={handleShare}
        isForking={forkMutation.isPending}
        isLoggedIn={!!session?.user}
      />

      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {gamesData?.items && gamesData.items.length > 0 && (
          <>
            {top3.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="h-6 w-6 text-[var(--accent)]" />
                  <h2 className="text-2xl font-bold">Top Games</h2>
                </div>
                <p className="text-[var(--muted-foreground)] mb-8">
                  These are the highest-scoring games generated from this prompt.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top3[1] && <PodiumCard game={top3[1]} rank={2} />}
                  {top3[0] && <PodiumCard game={top3[0]} rank={1} isCenter />}
                  {top3[2] && <PodiumCard game={top3[2]} rank={3} />}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Gamepad2 className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <h2 className="text-xl font-bold">All Games</h2>
                </div>

                <ArcadeCard>
                  <div className="divide-y divide-[var(--border)]">
                    {rest.map((game, idx) => (
                      <GameRow key={game.id} game={game} rank={idx + 4} />
                    ))}
                  </div>
                </ArcadeCard>
              </section>
            )}
          </>
        )}

        {isGamesLoading && (
          <ArcadeCard className="p-8">
            <LoadingState message="Loading games..." />
          </ArcadeCard>
        )}

        {!isGamesLoading && gamesData?.items?.length === 0 && (
          <ArcadeCard className="p-10 text-center">
            <Gamepad2 className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">No Games Yet</h3>
            <p className="text-[var(--muted-foreground)] mb-6">
              No completed games have been generated from this prompt yet.
            </p>
            {session?.user && (
              <ArcadeButton variant="primary" onClick={() => forkMutation.mutate()} disabled={forkMutation.isPending}>
                <GitFork className="h-4 w-4" />
                Fork This Prompt
              </ArcadeButton>
            )}
          </ArcadeCard>
        )}

        {!isForksLoading && forks && forks.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <GitFork className="h-5 w-5 text-[var(--muted-foreground)]" />
              <h2 className="text-xl font-bold">Forks</h2>
            </div>
            <p className="text-[var(--muted-foreground)] mb-6">
              Other creators who have forked this prompt.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {forks.map((fork) => (
                <ForkCard key={fork.id} fork={fork} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

interface HeroSectionProps {
  contentPreview: string;
  author: { id: string; name: string | null; image: string | null } | null;
  theme: { id: string; title: string } | null;
  stats: {
    gameCount: number;
    forkCount: number;
    avgRating: number;
    ratingCount: number;
  };
  onPlayBest?: () => void;
  onFork: () => void;
  onShare: () => void;
  isForking: boolean;
  isLoggedIn: boolean;
}

function HeroSection({
  contentPreview,
  author,
  theme,
  stats,
  onPlayBest,
  onFork,
  onShare,
  isForking,
  isLoggedIn,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)]/10 via-[var(--card)] to-[var(--card)] border-b border-[var(--border)]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-2 mb-4">
          <ArcadeBadge text="Prompt Gallery" variant="neon" />
          {theme && (
            <Link href={`/leaderboard?theme=${theme.id}`} className="hover:underline">
              <ArcadeBadge text={`Theme: ${theme.title}`} variant="default" />
            </Link>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black mb-4 leading-tight tracking-tight">
          &ldquo;{contentPreview}&rdquo;
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[var(--muted-foreground)]">
          {author && (
            <Link href={`/profile/${author.id}` as Route} className="inline-flex items-center gap-2 hover:text-[var(--foreground)]">
              {author.image && (
                <img src={author.image} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span>by @{author.name ?? "Anonymous"}</span>
            </Link>
          )}
          <span className="inline-flex items-center gap-1">
            <Gamepad2 className="h-4 w-4" />
            {stats.gameCount} games
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            {stats.forkCount} forks
          </span>
          {stats.avgRating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              {stats.avgRating.toFixed(1)} avg rating
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {onPlayBest && (
            <ArcadeButton variant="primary" onClick={onPlayBest}>
              <Play className="h-4 w-4" />
              Play Best Game
            </ArcadeButton>
          )}
          {isLoggedIn && (
            <ArcadeButton variant="outline" onClick={onFork} disabled={isForking}>
              <GitFork className="h-4 w-4" />
              {isForking ? "Forking..." : "Fork This"}
            </ArcadeButton>
          )}
          <ArcadeButton variant="outline" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </ArcadeButton>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ game, rank, isCenter = false }: { game: GameItem; rank: number; isCenter?: boolean }) {
  const rankStyles = {
    1: {
      container: "bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/30",
      badge: "bg-yellow-500 text-yellow-950",
      rankText: "1ST",
    },
    2: {
      container: "bg-gradient-to-br from-slate-400/10 via-slate-300/5 to-transparent border-slate-400/30",
      badge: "bg-slate-400 text-slate-950",
      rankText: "2ND",
    },
    3: {
      container: "bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border-amber-600/30",
      badge: "bg-amber-600 text-amber-50",
      rankText: "3RD",
    },
  };

  const style = rankStyles[rank as keyof typeof rankStyles] ?? rankStyles[1];

  return (
    <ArcadeCard variant={rank === 1 ? "glow" : "default"} className={`${style.container} ${isCenter ? "md:-mt-4" : ""}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
            {style.rankText}
          </span>
          {game.highScore !== null && (
            <span className="text-lg font-black text-[var(--primary)]">
              {game.highScore.toLocaleString()}
            </span>
          )}
        </div>

        <Link href={`/game/${game.id}` as Route} className="block">
          <h3 className="font-semibold mb-2 line-clamp-2 hover:text-[var(--primary)] transition-colors">
            {game.name ?? "Untitled Game"}
          </h3>
        </Link>

        <p className="text-xs text-[var(--muted-foreground)] mb-3">{game.modelName}</p>

        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-4">
          {game.avgRating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {game.avgRating.toFixed(1)}
            </span>
          )}
          <span>{game.ratingCount} ratings</span>
        </div>

        <Link href={`/game/${game.id}` as Route}>
          <ArcadeButton variant={rank === 1 ? "primary" : "outline"} className="w-full">
            <Play className="h-3.5 w-3.5" />
            Play
          </ArcadeButton>
        </Link>
      </div>
    </ArcadeCard>
  );
}

function GameRow({ game, rank }: { game: GameItem; rank: number }) {
  return (
    <Link href={`/game/${game.id}` as Route} className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/20 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-[var(--muted)]/30 flex items-center justify-center font-bold text-sm shrink-0">
        #{rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name ?? "Untitled Game"}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">{game.modelName}</p>
      </div>

      <div className="flex items-center gap-4 text-right shrink-0">
        {game.highScore !== null && (
          <div>
            <p className="font-bold text-[var(--primary)]">{game.highScore.toLocaleString()}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Score</p>
          </div>
        )}
        {game.avgRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">{game.avgRating.toFixed(1)}</span>
          </div>
        )}
        <div className="text-xs text-[var(--muted-foreground)]">
          {new Date(game.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

function ForkCard({ fork }: { fork: ForkItem }) {
  return (
    <ArcadeCard className="p-4 transition-all duration-200 hover:border-[var(--primary)]/50">
      <div className="flex items-start gap-3">
        {fork.author?.image && (
          <img src={fork.author.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${fork.author?.id}` as Route} className="font-medium hover:text-[var(--primary)]">
            @{fork.author?.name ?? "Anonymous"}
          </Link>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
            {fork.contentPreview}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <Gamepad2 className="h-3 w-3" />
              {fork.gameCount} games
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(fork.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </ArcadeCard>
  );
}
