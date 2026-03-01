"use client";

import type { Route } from "next";
import Link from "next/link";
import { FolderOpen, Globe } from "lucide-react";

import { ArcadeBadge, ArcadeButton, ArcadeCard } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import type { PublicCollectionListItem } from "@/lib/trpc-types";

interface PublicCollectionsCardProps {
  collections: PublicCollectionListItem[];
  className?: string;
}

export function PublicCollectionsCard({
  collections,
  className,
}: PublicCollectionsCardProps) {
  return (
    <ArcadeCard className={className}>
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Globe className="h-5 w-5 text-[var(--primary)]" />
          Public Collections
        </h3>
      </div>

      <div className="p-4">
        {collections.length === 0 ? (
          <EmptyState
            title="No public collections"
            message="This user has not published any collections yet."
          />
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="rounded-[var(--radius)] border border-[var(--border)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{collection.name}</p>
                    {collection.description ? (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    ) : null}
                  </div>
                  <ArcadeBadge
                    text={`${collection.collectionGames.length} games`}
                    variant="default"
                  />
                </div>

                <div className="mt-3">
                  <Link href={`/collections/${collection.id}` as Route}>
                    <ArcadeButton variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4" />
                      Open Collection
                    </ArcadeButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ArcadeCard>
  );
}
