import * as React from "react";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Game } from "@/types/entities";
import { cn } from "@/lib/utils";

export interface GameThumbnailCardProps {
  game: Game;
  imageUrl?: string | null;
  title?: string;
  description?: string;
  meta?: {
    creator?: string;
    createdAt?: Date;
    status?: string;
    tier?: string;
  };
  badges?: Array<{ text: string; variant?: string; icon?: ReactNode }>;
  footerAction?: ReactNode;
  onClick?: () => void;
}

const tierBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  cheater: {
    bg: "bg-red-500/10",
    text: "text-red-500 dark:text-red-400",
    border: "border-red-500/20",
  },
  impossible: {
    bg: "bg-purple-500/10",
    text: "text-purple-500 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  hard: {
    bg: "bg-orange-500/10",
    text: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/20",
  },
  normal: {
    bg: "bg-blue-500/10",
    text: "text-blue-500 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  easy: {
    bg: "bg-green-500/10",
    text: "text-green-500 dark:text-green-400",
    border: "border-green-500/20",
  },
};

const statusBadgeColors: Record<string, string> = {
  pending: "secondary",
  generating: "secondary",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
  hidden: "outline",
};

function GameThumbnailCard({
  game,
  imageUrl,
  title,
  description,
  meta,
  badges = [],
  footerAction,
  onClick,
}: GameThumbnailCardProps) {
  const displayImageUrl = imageUrl ?? game.imageUrl;
  const displayTitle = title;
  const displayDescription = description ?? game.prompt?.content;
  const displayMeta = {
    creator: meta?.creator ?? game.prompt?.user?.name,
    createdAt: meta?.createdAt ?? game.createdAt,
    status: meta?.status ?? game.status,
    tier: meta?.tier ?? game.modelTier,
  };

  const tierBadgeStyle = displayMeta.tier ? tierBadgeColors[displayMeta.tier] : null;
  const statusBadgeVariant = statusBadgeColors[displayMeta.status] ?? "outline";

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        onClick && "hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-primary">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={displayTitle ?? "Game thumbnail"}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <div className="text-primary/40 text-4xl font-bold">🎮</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
          {displayMeta.tier && tierBadgeStyle && (
            <Badge
              variant="outline"
              className={cn(
                "border-0",
                tierBadgeStyle.bg,
                tierBadgeStyle.text,
                tierBadgeStyle.border
              )}
            >
              {displayMeta.tier}
            </Badge>
          )}
          {displayMeta.status && (
            <Badge variant={statusBadgeVariant as any}>{displayMeta.status}</Badge>
          )}
          {badges.map((badge) => (
            <Badge key={badge.text} variant={badge.variant as any}>
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.text}
            </Badge>
          ))}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          {displayTitle && (
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
              {displayTitle}
            </h3>
          )}
          {displayDescription && (
            <p className="text-muted-foreground text-xs line-clamp-2">{displayDescription}</p>
          )}
          {(displayMeta.creator || displayMeta.createdAt) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {displayMeta.creator && (
                <>
                  <span className="font-medium">{displayMeta.creator}</span>
                  {displayMeta.createdAt && <span>•</span>}
                </>
              )}
              {displayMeta.createdAt && (
                <span>
                  {new Date(displayMeta.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      {footerAction && (
        <CardFooter className="p-4 pt-0">{footerAction}</CardFooter>
      )}
    </Card>
  );
}

export { GameThumbnailCard };
export default GameThumbnailCard;
