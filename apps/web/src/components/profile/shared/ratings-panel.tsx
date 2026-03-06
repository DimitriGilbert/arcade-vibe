"use client";

import { Star } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/reusable";
import type { Rating } from "@/lib/trpc-types";

export interface RatingsPanelProps {
  ratings: Rating[];
}

export function RatingsPanel({ ratings }: RatingsPanelProps) {
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-[var(--accent)]" />
            Ratings Given
          </h2>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]" />
              <span className="text-sm font-bold">{avgRating}</span>
            </div>
          )}
        </div>
      </div>

      {ratings.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8 opacity-50" />}
          message="No ratings yet"
        />
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-[var(--border)]">
            {ratings.slice(0, 8).map(rating => (
              <div key={rating.id} className="p-3 flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= rating.overall
                          ? 'fill-[var(--accent)] text-[var(--accent)]'
                          : 'text-[var(--muted-foreground)]/20'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{rating.game?.name || 'Unknown Game'}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </ArcadeCard>
  );
}
