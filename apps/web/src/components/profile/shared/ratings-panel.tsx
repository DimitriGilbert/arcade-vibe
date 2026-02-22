"use client";

import { Star } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { Rating } from "@/lib/trpc-types";

export interface RatingsPanelProps {
  ratings: Rating[];
}

export function RatingsPanel({ ratings }: RatingsPanelProps) {
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length).toFixed(1)
    : null;

  if (ratings.length === 0) {
    return (
      <ArcadeCard className="h-full">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-[var(--accent)]" />
              Ratings Given
            </h2>
          </div>
        </div>
        <div className="p-8 text-center text-[var(--muted-foreground)]">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No ratings yet</p>
        </div>
      </ArcadeCard>
    );
  }

  return (
    <ArcadeCard className="h-full">
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

      <div className="divide-y divide-[var(--border)] max-h-[300px] overflow-y-auto">
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
    </ArcadeCard>
  );
}
