import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/reusable";
import LoadingState from "@/components/reusable/loading-state";
import StarRatingDisplay from "@/components/reusable/star-rating-display";
import { Clock, Trophy } from "lucide-react";
import type { Rating } from "@/types";

interface RatingStatusCardProps {
  myRating: Rating | null;
  isGameLoaded: boolean;
  playtime: number;
  onRate: () => void;
}

export function RatingStatusCard({ myRating, isGameLoaded, playtime, onRate }: RatingStatusCardProps) {
  return (
    <InfoCard title="Rating Status" icon={<Trophy className="h-4 w-4 text-accent" />}>
      {myRating ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-card-foreground">
            You rated this game
          </p>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-accent">
              {myRating.overall}/5
            </div>
            <StarRatingDisplay rating={myRating.overall} size="sm" />
          </div>
        </div>
      ) : !isGameLoaded ? (
        <LoadingState size="sm" message="Loading game..." variant="muted" />
      ) : playtime < 60 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              Play for {60 - playtime} more seconds to rate
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${(playtime / 60) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            <span className="text-sm text-secondary">
              You can now rate this game!
            </span>
          </div>
          <Button onClick={onRate} size="sm" className="w-full">
            Rate Now
          </Button>
        </div>
      )}
    </InfoCard>
  );
}
