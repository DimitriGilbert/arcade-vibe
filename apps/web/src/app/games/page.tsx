import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Gamepad2, Layers, Play, Star, User } from "lucide-react";

import { ArcadeBadge, ArcadeButton, ArcadeCard } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";

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
  const resolvedSearchParams =
    (await searchParams) ?? ({ page: undefined } as { page?: string });
  const page = parsePageParam(resolvedSearchParams.page);

  const result = await trpcClient.games.listPublicPaginated.query({
    page,
    pageSize: PAGE_SIZE,
  });

  if (result.totalPages > 0 && page > result.totalPages) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <ArcadeCard>
          <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Game Library
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">
              All Published Games
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)] max-w-2xl">
              SEO-friendly game profiles with creator, theme, model, and score data.
            </p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                Total Games
              </p>
              <p className="mt-1 text-2xl font-bold">{result.total.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                Page
              </p>
              <p className="mt-1 text-2xl font-bold">{page}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                Per Page
              </p>
              <p className="mt-1 text-2xl font-bold">{PAGE_SIZE}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                Total Pages
              </p>
              <p className="mt-1 text-2xl font-bold">{Math.max(result.totalPages, 1)}</p>
            </div>
          </div>
        </ArcadeCard>

        {result.items.length === 0 ? (
          <ArcadeCard className="p-12">
            <EmptyState
              title="No published games yet"
              message="Games will appear here as soon as they are submitted."
            />
          </ArcadeCard>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {result.items.map((game) => {
              const gameTitle = game.name ?? game.theme?.title ?? "Untitled Game";
              const promptPreview =
                game.prompt.content.length > 140
                  ? `${game.prompt.content.slice(0, 140)}...`
                  : game.prompt.content;

              return (
                <ArcadeCard key={game.id} className="h-full flex flex-col p-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-lg leading-tight line-clamp-2">
                        {gameTitle}
                      </h2>
                      {game.tierCost?.slug && (
                        <ArcadeBadge text={game.tierCost.slug} variant="default" />
                      )}
                    </div>

                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">
                      {promptPreview}
                    </p>

                    <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
                      <p className="inline-flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {game.prompt.user?.name ?? "Anonymous"}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        {game.theme?.title ?? "No theme"}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" />
                        {game.modelName}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(game.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
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
                </ArcadeCard>
              );
            })}
          </section>
        )}

        {result.totalPages > 1 && (
          <ArcadeCard className="p-4">
            <div className="flex items-center justify-between gap-2">
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
            </div>
          </ArcadeCard>
        )}
      </div>
    </main>
  );
}
