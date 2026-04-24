"use client";

import * as React from "react";

import { useState } from "react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Game } from "@/lib/trpc-types";
import { cn } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";

export interface GameThumbnailCardProps {
  game: Game;
  title?: string;
  description?: string;
  meta?: {
    creator?: string;
    createdAt?: Date;
    status?: string;
    tier?: string;
  };
  badges?: Array<{ text: string; variant?: BadgeVariant; icon?: ReactNode }>;
  footerAction?: ReactNode;
  onClick?: () => void;
}

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

const tierBadgeColors: Record<string, string> = {
  cheater:
    "bg-[var(--destructive)]/15 text-[var(--destructive)] border-[var(--destructive)]/30",
  impossible:
    "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30",
  hard: "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30",
  normal:
    "bg-[var(--secondary)]/15 text-[var(--secondary)] border-[var(--secondary)]/30",
  easy: "bg-[var(--muted)]/40 text-[var(--foreground)] border-[var(--border)]",
};

const statusBadgeVariants: Record<string, BadgeVariant> = {
  pending: "secondary",
  generating: "secondary",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
  hidden: "outline",
};

function GameThumbnailCard({
  game,
  title,
  description,
  meta,
  badges = [],
  footerAction,
  onClick,
}: GameThumbnailCardProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = game.thumbnailUrl && !imageError;

  const displayTitle = title;
  const displayDescription = description ?? game.prompt?.content;
  const displayMeta = {
    creator: meta?.creator ?? game.prompt?.user?.name,
    createdAt: meta?.createdAt ?? game.createdAt,
    status: meta?.status ?? game.status,
    tier: meta?.tier,
  };

  const tierBadgeStyle = displayMeta.tier
    ? tierBadgeColors[displayMeta.tier]
    : null;
  const statusBadgeVariant = displayMeta.status
    ? (statusBadgeVariants[displayMeta.status] ?? "outline")
    : "outline";

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        onClick && "hover:-translate-y-1",
      )}
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-primary">
        {showImage ? (
          <img
            src={game.thumbnailUrl!}
            alt={game.name ?? "Game"}
            className="size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <Gamepad2 className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
          {displayMeta.tier && tierBadgeStyle && (
            <Badge variant="outline" className={cn("border", tierBadgeStyle)}>
              {displayMeta.tier}
            </Badge>
          )}
          {displayMeta.status && (
            <Badge variant={statusBadgeVariant}>{displayMeta.status}</Badge>
          )}
          {badges.map((badge) => {
            const resolvedVariant =
              badge.variant && badge.variant.length > 0
                ? badge.variant
                : "default";

            return (
              <Badge key={badge.text} variant={resolvedVariant}>
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.text}
              </Badge>
            );
          })}
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
            <p className="text-muted-foreground text-xs line-clamp-2">
              {displayDescription}
            </p>
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
