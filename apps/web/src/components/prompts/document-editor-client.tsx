"use client";

import type { Route } from "next";
import type { PromptGetPublicByIdOutput, PromptListGamesByPromptOutput, PromptListForksByPromptOutput } from "@/lib/trpc-types";

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
  Sparkles,
  TrendingUp,
  Users,
  ExternalLink,
  Quote,
} from "lucide-react";
import { toast } from "sonner";

import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import UserAvatar from "@/components/reusable/user-avatar";
import { ShareDropdown } from "@/components/shared/share-dropdown";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";

interface DocumentEditorClientProps {
  promptId: string;
}

type GameItem = NonNullable<PromptListGamesByPromptOutput>["items"][number];
type ForkItem = PromptListForksByPromptOutput[number];

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  delay = "0s",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  delay?: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-500 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 animate-fade-in-up animate-fill-mode-backwards"
      style={{ animationDelay: delay }}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-60" />

      {/* Background glow */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--primary)] opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            {label}
          </span>
        </div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {subtext && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, index }: { game: GameItem; index: number }) {
  const animationDelay = `${0.1 + index * 0.05}s`;

  return (
    <article
      className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg animate-fade-in-up animate-fill-mode-backwards"
      style={{ animationDelay }}
    >
      {/* Hover gradient line */}
      <div className="absolute top-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/50 to-transparent transition-all duration-300 hover:w-full" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Game number badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--muted)] font-mono text-xs font-bold text-[var(--muted-foreground)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            {game.theme?.title && (
              <ArcadeBadge
                text={game.theme.title}
                variant="default"
                className="text-[10px]"
              />
            )}
            {game.tier?.name && (
              <ArcadeBadge
                text={game.tier.name}
                variant="neon"
                className="text-[10px]"
              />
            )}
          </div>

          {/* Game name - clickable */}
          <Link
            href={`/game/${game.id}` as Route}
            className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)] line-clamp-1"
          >
            {game.name || "Untitled Game"}
          </Link>

          {/* Date */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Calendar className="h-3 w-3" />
            <span>{formatRelativeTime(game.createdAt)}</span>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3">
          {/* Rating */}
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Rating</p>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="font-bold">
                {game.avgRating > 0 ? game.avgRating.toFixed(1) : "-"}
              </span>
            </div>
          </div>

          {/* High score */}
          {game.highScore !== null && (
            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)]">High Score</p>
              <p className="font-bold text-[var(--primary)]">
                {game.highScore.toLocaleString()}
              </p>
            </div>
          )}

          {/* Share button */}
          <ShareDropdown
            url={`${process.env.NEXT_PUBLIC_APP_URL}/game/${game.id}`}
            title={game.name || "Play this game"}
          />

          {/* Play button */}
          <Link
            href={`/game/${game.id}` as Route}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-transform hover:scale-110"
          >
            <Play className="h-4 w-4" fill="currentColor" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ForkCard({ fork, index }: { fork: ForkItem; index: number }) {
  const animationDelay = `${0.1 + index * 0.05}s`;

  return (
    <article
      className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg animate-fade-in-up animate-fill-mode-backwards"
      style={{ animationDelay }}
    >
      <div className="flex items-center gap-4">
        <UserAvatar user={fork.author ?? undefined} size="md" variant="gradient" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--foreground)]">
            {fork.author?.name ?? "Anonymous"}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
            {fork.contentPreview}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium">{formatRelativeTime(fork.createdAt)}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {fork.gameCount} game{fork.gameCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function DocumentEditorClient({ promptId }: DocumentEditorClientProps) {
  const { data: session } = authClient.useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"games" | "forks">("games");

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

  const displayTitle = prompt.title || "Untitled Prompt";
  const truncatedContent = prompt.content.length > 400
    ? prompt.content.slice(0, 400) + "..."
    : prompt.content;
  const displayContent = isExpanded ? prompt.content : truncatedContent;
  const shareTitle = prompt.title || prompt.content.slice(0, 50) || "Prompt";

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Navigation */}
        <Link
          href={"/prompts/document" as Route}
          className="group mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Prompts</span>
        </Link>

        {/* Hero Section */}
        <header className="mb-10 animate-fade-in-up animate-fill-mode-backwards">
          {/* Author and meta row */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <UserAvatar
              user={prompt.author ?? undefined}
              size="lg"
              variant="gradient"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[var(--foreground)]">
                {prompt.author?.name ?? "Anonymous"}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatRelativeTime(prompt.createdAt)}
                </span>
                <span className="text-[var(--border)]">•</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {prompt.tokenCount} tokens
                </span>
                <span className="text-[var(--border)]">•</span>
                <span>v{prompt.version}</span>
              </div>
            </div>

            {prompt.theme && (
              <ArcadeBadge
                text={prompt.theme.title}
                variant="neon"
                className="ml-auto"
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl mb-6">
            <span className="bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
              {displayTitle}
            </span>
          </h1>

          {/* Decorative underline */}
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-transparent mb-8" />
        </header>

        {/* Prompt Content - The Hero */}
        <section className="mb-10 animate-fade-in-up animate-fill-mode-backwards" style={{ animationDelay: "0.1s" }}>
          <div className="relative">
            {/* Quote decoration */}
            <Quote className="absolute -left-2 -top-2 h-8 w-8 text-[var(--primary)]/20" />

            <div
              className={`
                relative rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--muted)]/10
                p-6 md:p-8 transition-all duration-500
                ${isExpanded ? "shadow-xl" : "shadow-lg"}
              `}
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5 opacity-0 transition-opacity hover:opacity-100" />

              <pre className="relative whitespace-pre-wrap font-mono text-sm md:text-base leading-relaxed text-[var(--foreground)]">
                {displayContent}
              </pre>

              {/* Expand/collapse indicator */}
              {prompt.content.length > 400 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/80"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show full prompt ({prompt.content.length} characters)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="mb-10 flex flex-wrap gap-3 animate-fade-in-up animate-fill-mode-backwards" style={{ animationDelay: "0.15s" }}>
          {topRatedGame && (
            <Link href={`/game/${topRatedGame.id}` as Route}>
              <ArcadeButton variant="primary" size="lg">
                <Play className="h-4 w-4" />
                Play Best Game
              </ArcadeButton>
            </Link>
          )}
          {session?.user && (
            <ArcadeButton
              variant="outline"
              size="lg"
              onClick={() => forkMutation.mutate()}
              disabled={forkMutation.isPending}
            >
              <GitFork className="h-4 w-4" />
              Fork Prompt
            </ArcadeButton>
          )}
          <ArcadeButton variant="outline" size="lg" onClick={handleCopyPrompt}>
            <Copy className="h-4 w-4" />
            Copy
          </ArcadeButton>
          <ShareDropdown
            url={`${process.env.NEXT_PUBLIC_APP_URL}/prompts/document/${promptId}`}
            title={shareTitle}
            trigger={
              <ArcadeButton variant="outline" size="lg">
                <ExternalLink className="h-4 w-4" />
                Share
              </ArcadeButton>
            }
          />
        </section>

        {/* Stats Section */}
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in-up animate-fill-mode-backwards" style={{ animationDelay: "0.2s" }}>
          <StatCard
            icon={Gamepad2}
            label="Games"
            value={prompt.stats.gameCount}
            subtext="Created with this prompt"
            delay="0.2s"
          />
          <StatCard
            icon={GitFork}
            label="Forks"
            value={prompt.stats.forkCount}
            subtext="Community variations"
            delay="0.25s"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Rating"
            value={prompt.stats.avgRating > 0 ? prompt.stats.avgRating.toFixed(1) : "-"}
            subtext={prompt.stats.avgRating > 0 ? "Out of 5 stars" : "No ratings yet"}
            delay="0.3s"
          />
        </section>

        {/* Tabs Section */}
        <section className="animate-fade-in-up animate-fill-mode-backwards" style={{ animationDelay: "0.35s" }}>
          {/* Custom Tabs */}
          <div className="mb-6 flex border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveTab("games")}
              className={`
                relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === "games"
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }
              `}
            >
              <Gamepad2 className="h-4 w-4" />
              Games
              <span className={`
                ml-1 rounded-full px-2 py-0.5 text-xs
                ${activeTab === "games"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }
              `}>
                {prompt.stats.gameCount}
              </span>
              {activeTab === "games" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("forks")}
              className={`
                relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === "forks"
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }
              `}
            >
              <Users className="h-4 w-4" />
              Forks
              <span className={`
                ml-1 rounded-full px-2 py-0.5 text-xs
                ${activeTab === "forks"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }
              `}>
                {prompt.stats.forkCount}
              </span>
              {activeTab === "forks" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === "games" && (
              <>
                {isGamesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingState message="Loading games..." />
                  </div>
                ) : !gamesData?.items || gamesData.items.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10">
                    <EmptyState
                      title="No games yet"
                      message="No public games have been created with this prompt."
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gamesData.items.map((game, index) => (
                      <GameCard key={game.id} game={game} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "forks" && (
              <>
                {isForksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingState message="Loading forks..." />
                  </div>
                ) : !forks || forks.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10">
                    <EmptyState
                      title="No forks yet"
                      message="No one has forked this prompt yet. Be the first!"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {forks.map((fork, index) => (
                      <ForkCard key={fork.id} fork={fork} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center animate-fade-in animate-delay-500">
          <p className="text-sm text-[var(--muted-foreground)]">
            Share this prompt with the community
          </p>
        </footer>
      </div>
    </main>
  );
}
