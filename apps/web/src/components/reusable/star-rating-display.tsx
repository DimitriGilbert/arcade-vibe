import type { LucideIcon } from "lucide-react";
import { Star, Heart, ThumbsUp } from "lucide-react";

type StarRatingDisplaySize = "sm" | "md" | "lg";
type StarRatingDisplayIcon = "star" | "heart" | "thumbs";

interface StarRatingDisplayProps {
  rating: number;
  max?: number;
  size?: StarRatingDisplaySize;
  icon?: StarRatingDisplayIcon;
  showValue?: boolean;
  readonly?: boolean;
}

const iconMap: Record<StarRatingDisplayIcon, LucideIcon> = {
  star: Star,
  heart: Heart,
  thumbs: ThumbsUp,
};

const sizeMap: Record<StarRatingDisplaySize, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function StarRatingDisplay({
  rating,
  max = 5,
  size = "md",
  icon = "star",
  showValue = false,
  readonly = true,
}: StarRatingDisplayProps) {
  const Icon = iconMap[icon];
  const sizeClass = sizeMap[size];
  const filledStars = Math.min(Math.max(0, rating), max);
  const emptyStars = max - filledStars;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: filledStars }, (_, i) => i + 1).map((starNumber) => (
        <Icon
          key={`filled-star-${starNumber}`}
          className={`${sizeClass} fill-accent text-accent`}
          aria-hidden="true"
        />
      ))}
      {Array.from({ length: emptyStars }, (_, i) => i + filledStars + 1).map((starNumber) => (
        <Icon
          key={`empty-star-${starNumber}`}
          className={`${sizeClass} text-muted-foreground/30`}
          aria-hidden="true"
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">{rating}</span>
      )}
    </div>
  );
}
