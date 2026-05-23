import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Gamepad2, Layers, Play, Star, User } from "lucide-react";

import { ArcadeBadge, ArcadeButton, ArcadeCard } from "@/components/arcade";
import { JsonLd } from "@/components/JsonLd";
import { EmptyState } from "@/components/reusable";
import { getModelDetailRoute } from "@/lib/model-routes";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";
import { getServerCaller } from "@/utils/trpc-server";

const PAGE_SIZE = 12;

interface GamesLibraryPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Game Library | Arcade Vibe",
  description:
    "Browse all published games on Arcade Vibe. Discover game details, creators, themes, and play from dedicated SEO-friendly pages.",
};

function parsePageParam(value: string | undefined): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function getPageHref(page: number): Route {
  if (page <= 1) {
    return "/games" as Route;
  }
  return `/games?page=${page}` as Route;
}

export default async function GamesLibraryPage({
  searchParams,
}: GamesLibraryPageProps) {
  const caller = await getServerCaller();
  const resolvedSearchParams =
    (await searchParams) ?? ({ page: undefined } as { page?: string });
  const page = parsePageParam(resolvedSearchParams.page);

  const [result, models] = await Promise.all([
    caller.games.listPublicPaginated({
      page,
      pageSize: PAGE_SIZE,
    }),
    caller.models.listWithStats(),
  ]);

  if (result.totalPages > 0 && page > result.totalPages) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        id="games-json-ld"
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${toAbsoluteUrl("/games")}#collection`,
          name: "Game Library",
          url: toAbsoluteUrl("/games"),
          description:
            "Browse published AI-generated games on Arcade Vibe with creators, themes, and model details.",
          inLanguage: "en",
          isPartOf: {
            "@id": `${getSiteUrl()}/#website`,
          },
        }}
      />
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="space-y-4 border-b border-[var(--border)] pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Game Library
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">All Published Games</h1>
              <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
                Browse submitted games.
              </p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Page {page} of {Math.max(result.totalPages, 1)}
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs">
            <li className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
              {result.total.toLocaleString()} total games
            </li>
            <li className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
              {PAGE_SIZE} per page
            </li>
            <li className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
              {Math.max(result.totalPages, 1)} total pages
            </li>
          </ul>
        </header>

        {result.items.length === 0 ? (
          <ArcadeCard className="p-12">
            <EmptyState
              title="No published games yet"
              message="Games will appear here as soon as they are submitted."
            />
          </ArcadeCard>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((game) => {
              const gameTitle = game.name ?? game.theme?.title ?? "Untitled Game";
              const matchedModel = models.find(
                (model) =>
                  model.modelName === game.modelName &&
                  model.providers.some((provider) => provider === game.modelProvider),
              );

              return (
                <ArcadeCard key={game.id} className="flex h-full flex-col overflow-hidden p-0">
                  {game.thumbnailUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={game.thumbnailUrl}
                        alt={gameTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center">
                      <Gamepad2 className="w-12 h-12 text-[var(--primary)]/20" />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 text-xs text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-2">
                      {game.tierCost?.slug && (
                        <ArcadeBadge text={game.tierCost.slug} variant="default" />
                      )}
                      {!game.tierCost?.slug && "Standard"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(game.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="line-clamp-2 text-lg font-bold leading-tight">{gameTitle}</h2>

                    <div className="mt-4 space-y-2 text-xs text-[var(--muted-foreground)]">
                      <p className="inline-flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {game.prompt.user ? (
                          <Link
                            href={`/profile/${game.prompt.user.id}` as Route}
                            className="hover:text-[var(--primary)]"
                          >
                            {game.prompt.user.name ?? "Anonymous"}
                          </Link>
                        ) : (
                          "Anonymous"
                        )}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        {game.theme?.title ?? "No theme"}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" />
                        {matchedModel ? (
                          <Link
                            href={getModelDetailRoute(game.modelName, matchedModel.id)}
                            className="hover:text-[var(--primary)]"
                          >
                            {game.modelName}
                          </Link>
                        ) : (
                          <Link href={"/models" as Route} className="hover:text-[var(--primary)]">
                            {game.modelName}
                          </Link>
                        )}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link href={`/games/${game.id}` as Route}>
                        <ArcadeButton variant="outline" className="w-full">
                          <Gamepad2 className="h-4 w-4" />
                          Details
                        </ArcadeButton>
                      </Link>
                      <Link href={`/game/${game.id}` as Route}>
                        <ArcadeButton variant="primary" className="w-full">
                          <Play className="h-4 w-4" />
                          Play
                        </ArcadeButton>
                      </Link>
                    </div>
                  </div>
                </ArcadeCard>
              );
            })}
          </section>
        )}

        {result.totalPages > 1 && (
          <nav className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-6">
            {result.hasPreviousPage ? (
              <Link href={getPageHref(page - 1)}>
                <ArcadeButton variant="outline">Previous</ArcadeButton>
              </Link>
            ) : (
              <ArcadeButton variant="outline" disabled>
                Previous
              </ArcadeButton>
            )}

            <p className="text-sm text-[var(--muted-foreground)]">
              Page {page} of {result.totalPages}
            </p>

            {result.hasNextPage ? (
              <Link href={getPageHref(page + 1)}>
                <ArcadeButton variant="outline">Next</ArcadeButton>
              </Link>
            ) : (
              <ArcadeButton variant="outline" disabled>
                Next
              </ArcadeButton>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
