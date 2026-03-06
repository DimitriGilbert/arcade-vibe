import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";

// TODO: Refactor to use direct Drizzle queries via a lib file (see @/lib/profile-data.ts pattern)
// The tRPC server caller approach is over-engineered for simple data fetching.
// Should create @/lib/model-data.ts with direct db queries like profile pages do.
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Cpu,
  Gamepad2,
  Star,
} from "lucide-react";

import { ArcadeBadge, ArcadeCard } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import { getModelDetailRoute, getModelIdFromSegment } from "@/lib/model-routes";
import { StatRow } from "@/components/models";
import { getServerCaller } from "@/utils/trpc-server";
import { GameActionsClient } from "./game-actions-client";

interface ModelDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ModelDetailPageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = getModelIdFromSegment(rawId);

  try {
    const caller = await getServerCaller();
    const model = await caller.models.getByIdWithStats({ id });

    if (!model) {
      return { title: "Model Not Found" };
    }

    const description = `${model.modelName} - ${model.tierName} model with ${model.gameCount} published games. Average rating: ${model.avgRating > 0 ? model.avgRating.toFixed(2) : "N/A"}. Providers: ${model.providers.join(", ")}`;

    return {
      title: `${model.modelName} - Model Profile`,
      description,
      alternates: {
        canonical: getModelDetailRoute(model.modelName, model.id),
      },
      openGraph: {
        title: `${model.modelName} - Arcade Vibe Model Profile`,
        description,
      },
    };
  } catch {
    return { title: "Model Profile" };
  }
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id: rawId } = await params;
  const id = getModelIdFromSegment(rawId);

  let model;
  let games;

  try {
    const caller = await getServerCaller();
    [model, games] = await Promise.all([
      caller.models.getByIdWithStats({ id }),
      caller.models.listGamesByModel({ modelId: id }),
    ]);
  } catch {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState title="Error loading model" message="Please try again later." />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState title="Model not found" message="This model does not exist." />
      </div>
    );
  }

  const canonicalRoute = getModelDetailRoute(model.modelName, model.id);
  const canonicalSegment = canonicalRoute.replace("/models/", "");

  if (rawId !== canonicalSegment) {
    permanentRedirect(canonicalRoute);
  }

  const topRatedGame =
    games && games.length > 0
      ? [...games].sort((a, b) => b.avgRating - a.avgRating)[0] ?? null
      : null;

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="container mx-auto px-4 pt-8 grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <ArcadeCard className="p-5">
            <Link
              href={"/models" as Route}
              className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Models
            </Link>

            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Model Profile
            </p>
            <h1 className="mt-2 break-words text-2xl font-black leading-tight">
              {model.modelName}
            </h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <ArcadeBadge text={model.tierName} variant="default" />
              {model.providers.map((provider) => (
                <ArcadeBadge
                  key={provider}
                  text={provider}
                  className="bg-[var(--muted)]/60 text-xs"
                />
              ))}
            </div>
          </ArcadeCard>

          <ArcadeCard className="p-4 space-y-3">
            <StatRow label="Published games" value={model.gameCount.toLocaleString()} icon={<Gamepad2 className="h-4 w-4" />} />
            <StatRow
              label="Average rating"
              value={model.avgRating > 0 ? model.avgRating.toFixed(2) : "-"}
              icon={<Star className="h-4 w-4" />}
            />
            <StatRow label="Total ratings" value={model.ratingCount.toLocaleString()} icon={<Cpu className="h-4 w-4" />} />
          </ArcadeCard>

          {topRatedGame && (
            <ArcadeCard className="p-4 bg-[var(--muted)]/20">
              <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                Best rated game
              </p>
              <Link
                href={`/game/${topRatedGame.id}` as Route}
                className="mt-2 inline-flex items-start gap-2 font-semibold hover:text-[var(--primary)]"
              >
                <span className="line-clamp-2">{topRatedGame.name || "Untitled Game"}</span>
                <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0" />
              </Link>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Avg {topRatedGame.avgRating > 0 ? topRatedGame.avgRating.toFixed(2) : "-"} from {topRatedGame.ratingCount} ratings
              </p>
            </ArcadeCard>
          )}
        </aside>

        <section className="space-y-4">
          <ArcadeCard className="p-5">
            <h2 className="text-xl font-bold">Generated Games</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Recent completed public games generated with this model.
            </p>
          </ArcadeCard>

          {!games || games.length === 0 ? (
            <ArcadeCard className="p-10">
              <EmptyState
                title="No games yet"
                message="No public completed games are available for this model."
              />
            </ArcadeCard>
          ) : (
            <div className="space-y-3">
              {games.map((game, index) => {
                const ratingBarWidth = Math.max(
                  0,
                  Math.min(100, (game.avgRating / 5) * 100),
                );

                return (
                  <ArcadeCard
                    key={game.id}
                    className="p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/20"
                  >
                    <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-start">
                      <div className="w-12 rounded-md border border-[var(--border)] bg-[var(--muted)]/20 px-2 py-2 text-center">
                        <p className="text-[10px] text-[var(--muted-foreground)]">#{index + 1}</p>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <Link
                          href={`/game/${game.id}` as Route}
                          className="inline-flex items-start gap-1.5 font-semibold hover:text-[var(--primary)]"
                        >
                          <span className="line-clamp-2">{game.name || "Untitled Game"}</span>
                          <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0" />
                        </Link>

                        {game.promptContent && (
                          <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                            {game.promptContent}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          <span>by {game.author ? (
                            <Link
                              href={`/profile/${game.author.id}` as Route}
                              className="hover:text-[var(--primary)]"
                            >
                              {game.author.name || "Anonymous"}
                            </Link>
                          ) : "Anonymous"}</span>
                          {game.theme?.title && <span>Theme: {game.theme.title}</span>}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(game.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <GameActionsClient
                          gameId={game.id}
                          gameName={game.name}
                          promptId={game.promptId}
                        />
                      </div>

                      <div className="space-y-2 lg:min-w-[140px]">
                        <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/20 p-2 text-right">
                          <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                            Average
                          </p>
                          <p className="text-base font-bold">
                            {game.avgRating > 0 ? game.avgRating.toFixed(2) : "-"}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {game.ratingCount} ratings
                          </p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                          <div
                            className="h-full rounded-full bg-[var(--primary)]"
                            style={{ width: `${ratingBarWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </ArcadeCard>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
