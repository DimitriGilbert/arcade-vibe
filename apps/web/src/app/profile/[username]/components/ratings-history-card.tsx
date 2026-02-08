import { Star } from "lucide-react";
import type { Rating } from "@/types/entities";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import EmptyPlaceholder from "@/components/reusable/empty-placeholder";

interface RatingsHistoryCardProps {
  ratings: Rating[];
  isLoading: boolean;
}

export function RatingsHistoryCard({ ratings, isLoading }: RatingsHistoryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border-border rounded-lg p-6">
        <LoadingPlaceholder />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="bg-card border-border rounded-lg p-6">
        <EmptyPlaceholder />
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-lg p-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        Ratings History
      </h2>
      <div className="space-y-4">
        {ratings.slice(0, 10).map((rating) => (
          <div
            key={rating.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating.overall
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">
                Game ID: {rating.gameId}
              </p>
              {rating.feedback && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rating.feedback}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(rating.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
