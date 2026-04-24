import type { Metadata } from "next";
import type { Route } from "next";
import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Code2,
  FileText,
  Gamepad2,
  Layers,
  Play,
  Trophy,
  User,
} from "lucide-react";

import {
  ArcadeBadge,
  ArcadeButton,
  ArcadeCard,
  ArcadeTabs,
  ArcadeTabsContent,
  ArcadeTabsList,
  ArcadeTabsTrigger,
} from "@/components/arcade";
import { getModelDetailRoute } from "@/lib/model-routes";
import { InfoCard } from "@/components/reusable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getServerCaller } from "@/utils/trpc-server";

interface GameInfoPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getGameData(gameId: string) {
  try {
    const caller = await getServerCaller();
    const [game, stats, leaderboard, models] = await Promise.all([
      caller.games.getPublicById({ id: gameId }),
      caller.gameLeaderboard.getStats({ gameId }),
      caller.gameLeaderboard.getLeaderboard({ gameId, limit: 10 }),
      caller.models.listWithStats(),
    ]);

    const matchedModel = models.find(
      (model) =>
        model.modelName === game.modelName &&
        model.providers.some((provider) => provider === game.modelProvider),
    );

    return {
      game,
      stats,
      leaderboard,
      modelPageId: matchedModel?.id ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: GameInfoPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getGameData(id);

  if (!data) {
    return {
      title: "Game Not Found | Arcade Vibe",
      description: "This game page could not be found.",
    };
  }

  const gameTitle = data.game.name ?? data.game.theme?.title ?? "Untitled Game";
  const promptExcerpt = data.game.prompt.content.slice(0, 140);
  const description =
    promptExcerpt.length > 0
      ? `${promptExcerpt}${data.game.prompt.content.length > 140 ? "..." : ""}`
      : `Game details, creator info, leaderboard stats, and model data for ${gameTitle}.`;

  return {
    title: `${gameTitle} | Game Details | Arcade Vibe`,
    description,
    alternates: {
      canonical: `/games/${id}`,
    },
    openGraph: {
      title: `${gameTitle} | Arcade Vibe`,
      description,
      type: "article",
      ...(data.game.thumbnailUrl && { images: [data.game.thumbnailUrl] }),
    },
  };
}

export default async function GameInfoPage({ params }: GameInfoPageProps) {
  const { id } = await params;
  const data = await getGameData(id);

  if (!data) {
    notFound();
  }

  const { game, stats, leaderboard, modelPageId } = data;
  const gameTitle = game.name ?? game.theme?.title ?? "Untitled Game";
  const creatorName = game.prompt.user?.name ?? "Anonymous";
  const hasPromptContent = game.prompt.content.trim().length > 0;
  const avgScore =
    stats?.avgScore !== null && stats?.avgScore !== undefined
      ? Number(stats.avgScore)
      : null;

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <ArcadeCard>
          <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <ArcadeBadge text={game.status} variant="neon" />
              {game.theme?.title && (
                <ArcadeBadge text={game.theme.title} variant="default" />
              )}
              <ArcadeBadge text={game.modelProvider} variant="default" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">{gameTitle}</h1>
            <p className="mt-3 text-[var(--muted-foreground)] max-w-3xl">
              Created by{" "}
              {game.prompt.user ? (
                <Link
                  href={`/profile/${game.prompt.user.id}` as Route}
                  className="text-[var(--foreground)] hover:text-[var(--primary)]"
                >
                  {creatorName}
                </Link>
              ) : (
                creatorName
              )}{" "}
              with{" "}
              {modelPageId ? (
                <Link
                  href={getModelDetailRoute(game.modelName, modelPageId)}
                  className="text-[var(--foreground)] hover:text-[var(--primary)]"
                >
                  {game.modelName}
                </Link>
              ) : (
                game.modelName
              )}{" "}
              ({game.modelProvider}).
            </p>
          </div>

          <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              icon={<User className="h-4 w-4" />}
              label="Creator"
              value={
                game.prompt.user ? (
                  <Link
                    href={`/profile/${game.prompt.user.id}` as Route}
                    className="hover:text-[var(--primary)]"
                  >
                    {creatorName}
                  </Link>
                ) : (
                  creatorName
                )
              }
            />
            <StatTile
              icon={<Code2 className="h-4 w-4" />}
              label="Model"
              value={
                modelPageId ? (
                  <Link
                    href={getModelDetailRoute(game.modelName, modelPageId)}
                    className="hover:text-[var(--primary)]"
                  >
                    {game.modelName}
                  </Link>
                ) : (
                  game.modelName
                )
              }
            />
            <StatTile
              icon={<Trophy className="h-4 w-4" />}
              label="High Score"
              value={
                stats?.highScore !== null && stats?.highScore !== undefined
                  ? Number(stats.highScore).toLocaleString()
                  : "N/A"
              }
            />
            <StatTile
              icon={<Gamepad2 className="h-4 w-4" />}
              label="Total Plays"
              value={(stats?.totalPlays ?? 0).toLocaleString()}
            />
          </div>

          <div className="px-6 pb-6 flex flex-wrap gap-2">
            <Link href={`/game/${game.id}` as Route}>
              <ArcadeButton variant="primary">
                <Play className="h-4 w-4" />
                Play Game
              </ArcadeButton>
            </Link>
            {game.prompt.visibility === "public" && (
              <Link href={`/prompts/${game.prompt.id}` as Route}>
                <ArcadeButton variant="outline">
                  <FileText className="h-4 w-4" />
                  View Prompt
                </ArcadeButton>
              </Link>
            )}
            <Link href={"/games" as Route}>
              <ArcadeButton variant="outline">Back to Library</ArcadeButton>
            </Link>
          </div>
        </ArcadeCard>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <InfoCard
            title="Prompt"
            subtitle="Original generation instruction"
            icon={<Layers className="h-4 w-4 text-[var(--primary)]" />}
          >
            {hasPromptContent ? (
              <ScrollArea className="h-[640px] rounded-md border border-[var(--border)] bg-[var(--muted)]/10 p-4">
                <pre className="text-sm whitespace-pre-wrap break-words text-[var(--muted-foreground)]">
                  {game.prompt.content}
                </pre>
              </ScrollArea>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Prompt content is private for this game.
              </p>
            )}
          </InfoCard>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <ArcadeCard>
              <div className="p-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[var(--accent)]" />
                  Top Scores
                </h2>
              </div>
              <div className="p-4">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No scores yet for this game.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <div
                        key={entry.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            #{index + 1} {entry.user?.name ?? "Anonymous"}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {new Date(entry.playedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="font-bold text-[var(--primary)]">
                          {entry.score.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ArcadeCard>

            <ArcadeCard className="p-4">
              <ArcadeTabs defaultValue="metadata">
                <ArcadeTabsList className="w-full">
                  <ArcadeTabsTrigger value="metadata" className="flex-1">
                    <Calendar className="h-4 w-4" />
                    Metadata
                  </ArcadeTabsTrigger>
                  <ArcadeTabsTrigger value="performance" className="flex-1">
                    <Clock className="h-4 w-4" />
                    Performance
                  </ArcadeTabsTrigger>
                </ArcadeTabsList>

                <ArcadeTabsContent value="metadata">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Game ID</span>
                      <span className="font-mono text-xs">{game.id}</span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Created</span>
                      <span>
                        {new Date(game.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Creator</span>
                      {game.prompt.user ? (
                        <Link
                          href={`/profile/${game.prompt.user.id}` as Route}
                          className="inline-flex items-center gap-1 hover:text-[var(--primary)]"
                        >
                          {game.prompt.user.name ?? "Anonymous"}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span>Anonymous</span>
                      )}
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Theme</span>
                      <span>{game.theme?.title ?? "No theme"}</span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Model</span>
                      {modelPageId ? (
                        <Link
                          href={getModelDetailRoute(game.modelName, modelPageId)}
                          className="inline-flex items-center gap-1 hover:text-[var(--primary)]"
                        >
                          {game.modelName}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span>{game.modelName}</span>
                      )}
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Provider</span>
                      <span>{game.modelProvider}</span>
                    </p>
                  </div>
                </ArcadeTabsContent>

                <ArcadeTabsContent value="performance">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Average Score</span>
                      <span>{avgScore !== null ? avgScore.toFixed(1) : "N/A"}</span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">High Score</span>
                      <span>
                        {stats?.highScore !== null && stats?.highScore !== undefined
                          ? Number(stats.highScore).toLocaleString()
                          : "N/A"}
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Total Plays</span>
                      <span>{(stats?.totalPlays ?? 0).toLocaleString()}</span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">Unique Players</span>
                      <span>{stats?.uniquePlayers ?? 0}</span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">
                        Avg Completion Time
                      </span>
                      <span>
                        {stats?.avgPlaytime !== null && stats?.avgPlaytime !== undefined
                          ? `${Math.round(Number(stats.avgPlaytime))}s`
                          : "N/A"}
                      </span>
                    </p>
                  </div>
                </ArcadeTabsContent>
              </ArcadeTabs>
            </ArcadeCard>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] inline-flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-bold truncate">{value}</p>
    </div>
  );
}
