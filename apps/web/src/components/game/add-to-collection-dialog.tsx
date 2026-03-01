"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Lock, Plus, Sparkles } from "lucide-react";

import {
  ArcadeButton,
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogDescription,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeInput,
  ArcadeTextarea,
} from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

interface AddToCollectionDialogProps {
  gameId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToCollectionDialog({
  gameId,
  open,
  onOpenChange,
}: AddToCollectionDialogProps) {
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const {
    data: myCollections,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["collections", "mine"],
    queryFn: async () => {
      return await trpcClient.collections.listMine.query();
    },
    enabled: open && Boolean(session?.user),
  });

  const createCollectionMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.collections.create.mutate({
        name,
        description,
        isPublic,
      });
    },
    onSuccess: async (created) => {
      const addResult = await trpcClient.collections.addGame.mutate({
        collectionId: created.id,
        gameId,
      });

      if (addResult.added) {
        toast.success(`Added to ${created.name}`);
      } else {
        toast.info("Game was already in that collection");
      }

      setName("");
      setDescription("");
      setIsPublic(false);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create collection");
    },
  });

  const addGameMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      return await trpcClient.collections.addGame.mutate({
        collectionId,
        gameId,
      });
    },
    onSuccess: async (result) => {
      if (result.added) {
        toast.success("Game added to collection");
      } else {
        toast.info("Game is already in this collection");
      }
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add game to collection");
    },
  });

  const trimmedName = useMemo(() => name.trim(), [name]);

  if (!session?.user) {
    return (
      <ArcadeDialog open={open} onOpenChange={onOpenChange}>
        <ArcadeDialogContent>
          <ArcadeDialogHeader>
            <ArcadeDialogTitle>Save to Collection</ArcadeDialogTitle>
            <ArcadeDialogDescription>
              Sign in to save games in private or public collections.
            </ArcadeDialogDescription>
          </ArcadeDialogHeader>
        </ArcadeDialogContent>
      </ArcadeDialog>
    );
  }

  return (
    <ArcadeDialog open={open} onOpenChange={onOpenChange}>
      <ArcadeDialogContent className="max-w-2xl">
        <ArcadeDialogHeader>
          <ArcadeDialogTitle>Save to Collection</ArcadeDialogTitle>
          <ArcadeDialogDescription>
            Organize games into private or public collections for easy access.
          </ArcadeDialogDescription>
        </ArcadeDialogHeader>

        <div className="space-y-6">
          <div className="rounded-[var(--radius)] border border-[var(--border)] p-4 bg-[var(--muted)]/30">
            <h3 className="text-sm font-semibold mb-3">Create New Collection</h3>
            <div className="grid gap-3">
              <ArcadeInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Collection name"
                maxLength={80}
              />
              <ArcadeTextarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description"
                rows={3}
                maxLength={280}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
                >
                  {isPublic ? (
                    <>
                      <Globe className="size-4" />
                      Public collection
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Private collection
                    </>
                  )}
                </button>

                <ArcadeButton
                  variant="primary"
                  onClick={() => createCollectionMutation.mutate()}
                  disabled={trimmedName.length === 0 || createCollectionMutation.isPending}
                >
                  <Plus className="size-4" />
                  Create and add game
                </ArcadeButton>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Your Collections</h3>

            {isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Loading collections...</p>
            ) : !myCollections || myCollections.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-[var(--border)] p-6">
                <EmptyState
                  title="No collections yet"
                  message="Create your first collection to start saving games."
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {myCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{collection.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] inline-flex items-center gap-2">
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
                        <span>{collection.collectionGames.length} saved</span>
                      </p>
                    </div>

                    <ArcadeButton
                      variant="outline"
                      size="sm"
                      onClick={() => addGameMutation.mutate(collection.id)}
                      disabled={addGameMutation.isPending}
                    >
                      <Sparkles className="size-4" />
                      Add
                    </ArcadeButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
