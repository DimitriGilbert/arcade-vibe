"use client";

import { useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderLock, FolderOpen, Globe, Lock, Play } from "lucide-react";

import { ArcadeBadge, ArcadeButton, ArcadeCard } from "@/components/arcade";
import LoadingState from "@/components/reusable/loading-state";
import { EmptyState } from "@/components/reusable";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

export default function CollectionsPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    null,
  );

  const {
    data: collections,
    isLoading: isLoadingCollections,
  } = useQuery({
    queryKey: ["collections", "mine"],
    queryFn: async () => {
      return await trpcClient.collections.listMine.query();
    },
    enabled: Boolean(session?.user),
  });

  const effectiveSelectedCollectionId = selectedCollectionId ?? collections?.[0]?.id ?? null;

  const {
    data: selectedCollection,
    isLoading: isLoadingSelectedCollection,
  } = useQuery({
    queryKey: ["collections", "by-id", effectiveSelectedCollectionId],
    queryFn: async () => {
      if (!effectiveSelectedCollectionId) {
        return null;
      }
      return await trpcClient.collections.getById.query({
        id: effectiveSelectedCollectionId,
      });
    },
    enabled: Boolean(session?.user && effectiveSelectedCollectionId),
  });

  const selectedCollectionMeta = useMemo(() => {
    if (!collections || !effectiveSelectedCollectionId) {
      return null;
    }
    return (
      collections.find((collection) => collection.id === effectiveSelectedCollectionId) ?? null
    );
  }, [collections, effectiveSelectedCollectionId]);

  if (isSessionPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState size="lg" message="Loading collections..." centered />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <ArcadeCard className="p-12">
            <EmptyState
              title="Sign in to access collections"
              message="Create private or public collections and save games for later."
            />
          </ArcadeCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <ArcadeCard>
          <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Collections
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Your Saved Games</h1>
            <p className="mt-3 text-[var(--muted-foreground)] max-w-2xl">
              Organize games into private or public collections so you can quickly find them later.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Collections</h2>
              {isLoadingCollections ? (
                <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
              ) : !collections || collections.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-[var(--border)] p-4">
                  <EmptyState
                    title="No collections yet"
                    message="Open a game and use the folder icon to create one."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => {
                    const isSelected = effectiveSelectedCollectionId === collection.id;
                    return (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => setSelectedCollectionId(collection.id)}
                        className={`w-full rounded-[var(--radius)] border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/10"
                            : "border-[var(--border)] hover:bg-[var(--muted)]/30"
                        }`}
                      >
                        <p className="text-sm font-semibold truncate">{collection.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] inline-flex items-center gap-2 mt-1">
                          {collection.isPublic ? (
                            <>
                              <Globe className="size-3.5" /> Public
                            </>
                          ) : (
                            <>
                              <Lock className="size-3.5" /> Private
                            </>
                          )}
                          <span>•</span>
                          <span>{collection.collectionGames.length} games</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[var(--radius)] border border-[var(--border)] p-4 min-h-96">
              {!effectiveSelectedCollectionId ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyState
                    title="Pick a collection"
                    message="Select a collection on the left to view saved games."
                  />
                </div>
              ) : isLoadingSelectedCollection ? (
                <div className="h-full flex items-center justify-center">
                  <LoadingState message="Loading collection..." centered />
                </div>
              ) : !selectedCollection ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyState
                    title="Collection unavailable"
                    message="Try selecting another collection."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">{selectedCollection.collection.name}</h2>
                    {selectedCollection.collection.isPublic ? (
                      <ArcadeBadge text="Public" variant="default" />
                    ) : (
                      <ArcadeBadge text="Private" variant="default" />
                    )}
                    {selectedCollectionMeta?.isPublic && (
                      <Link
                        href={`/collections/${selectedCollection.collection.id}` as Route}
                        target="_blank"
                      >
                        <ArcadeButton size="sm" variant="outline">
                          <FolderOpen className="size-4" />
                          Open Public Page
                        </ArcadeButton>
                      </Link>
                    )}
                  </div>

                  {selectedCollection.collection.description && (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {selectedCollection.collection.description}
                    </p>
                  )}

                  {selectedCollection.games.length === 0 ? (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] p-8">
                      <EmptyState
                        title="No games saved"
                        message="Use the folder icon on any game to add it here."
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCollection.games.map((game) => {
                        const title = game.name ?? game.theme?.title ?? "Untitled Game";
                        const promptPreview =
                          game.prompt.content.length > 110
                            ? `${game.prompt.content.slice(0, 110)}...`
                            : game.prompt.content;

                        return (
                          <ArcadeCard key={game.id} className="p-4">
                            <div className="space-y-2">
                              <h3 className="font-semibold line-clamp-2">{title}</h3>
                              <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                                {promptPreview.length > 0
                                  ? promptPreview
                                  : "Prompt content is private"}
                              </p>
                              <div className="flex items-center justify-between gap-2 pt-2">
                                <span className="text-xs text-[var(--muted-foreground)] inline-flex items-center gap-1">
                                  <FolderLock className="size-3.5" />
                                  {game.theme?.title ?? "No theme"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Link href={`/games/${game.id}` as Route}>
                                    <ArcadeButton size="sm" variant="outline">
                                      Details
                                    </ArcadeButton>
                                  </Link>
                                  <Link href={`/game/${game.id}` as Route}>
                                    <ArcadeButton size="sm" variant="primary">
                                      <Play className="size-4" />
                                      Play
                                    </ArcadeButton>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </ArcadeCard>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ArcadeCard>
      </div>
    </main>
  );
}
