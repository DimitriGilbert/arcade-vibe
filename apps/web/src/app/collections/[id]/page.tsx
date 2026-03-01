import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Globe, Play, User } from "lucide-react";

import { ArcadeBadge, ArcadeButton, ArcadeCard } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";

interface PublicCollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPublicCollection(id: string) {
  try {
    return await trpcClient.collections.getPublicById.query({ id });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PublicCollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicCollection(id);

  if (!data) {
    return {
      title: "Collection Not Found | Arcade Vibe",
      description: "This public collection does not exist.",
    };
  }

  const title = `${data.collection.name} | Collections | Arcade Vibe`;
  const description =
    data.collection.description ??
    `Public game collection by ${data.collection.user?.name ?? "Arcade Vibe user"}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/collections/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function PublicCollectionPage({
  params,
}: PublicCollectionPageProps) {
  const { id } = await params;
  const data = await getPublicCollection(id);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <ArcadeCard>
          <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <ArcadeBadge text="Public Collection" variant="default" />
              <ArcadeBadge text={`${data.games.length} games`} variant="default" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">{data.collection.name}</h1>
            {data.collection.description && (
              <p className="mt-3 text-[var(--muted-foreground)] max-w-3xl">
                {data.collection.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
              <p className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {data.collection.user?.name ?? "Anonymous"}
              </p>
              <p className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(data.collection.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="inline-flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Publicly visible
              </p>
            </div>
          </div>
        </ArcadeCard>

        {data.games.length === 0 ? (
          <ArcadeCard className="p-12">
            <EmptyState
              title="No games in this collection yet"
              message="The owner has not added any public games to this collection yet."
            />
          </ArcadeCard>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.games.map((game) => {
              const title = game.name ?? game.theme?.title ?? "Untitled Game";
              const preview =
                game.prompt.content.length > 140
                  ? `${game.prompt.content.slice(0, 140)}...`
                  : game.prompt.content;

              return (
                <ArcadeCard key={game.id} className="h-full flex flex-col p-4">
                  <div className="space-y-3 flex-1">
                    <h2 className="font-bold text-lg leading-tight line-clamp-2">{title}</h2>
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">
                      {preview.length > 0 ? preview : "Prompt content is private"}
                    </p>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {game.prompt.user?.name ?? "Anonymous"} • {game.theme?.title ?? "No theme"}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/games/${game.id}` as Route}>
                      <ArcadeButton className="w-full" variant="outline">
                        Details
                      </ArcadeButton>
                    </Link>
                    <Link href={`/game/${game.id}` as Route}>
                      <ArcadeButton className="w-full" variant="primary">
                        <Play className="size-4" />
                        Play
                      </ArcadeButton>
                    </Link>
                  </div>
                </ArcadeCard>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
