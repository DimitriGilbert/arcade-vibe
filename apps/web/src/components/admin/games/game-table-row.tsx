"use client";

import type { Route } from "next";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { UserAvatar } from "@/components/reusable";
import type { GameAdminView, GameStatus } from "@/lib/trpc-types";

export interface GameTableRowProps {
  game: GameAdminView;
  onHideClick: (game: GameAdminView) => void;
  onUnhideClick: (gameId: string) => void;
  isUnhiding: boolean;
  getStatusBadge: (status: GameStatus) => React.ReactNode;
}

export function GameTableRow({
  game,
  onHideClick,
  onUnhideClick,
  isUnhiding,
  getStatusBadge,
}: GameTableRowProps) {
  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{game.name ?? "Untitled"}</div>
        <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
          {game.prompt?.content?.slice(0, 50)}...
        </div>
      </td>
      <td className="px-4 py-3">
        {game.prompt?.user ? (
          <div className="flex items-center gap-2">
            <UserAvatar user={game.prompt.user} size="xs" />
            <div>
              <div className="text-sm">{game.prompt.user.name ?? "Unknown"}</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {game.prompt.user.email}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-[var(--muted-foreground)]">Unknown</span>
        )}
      </td>
      <td className="px-4 py-3">
        {game.theme ? (
          <span className="text-sm">{game.theme.title}</span>
        ) : (
          <span className="text-[var(--muted-foreground)]">No theme</span>
        )}
      </td>
      <td className="px-4 py-3">{getStatusBadge(game.status)}</td>
      <td className="px-4 py-3">
        {game.isSubmitted ? (
          <ArcadeBadge text="Submitted" variant="neon" />
        ) : (
          <ArcadeBadge text="Draft" variant="default" />
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-[var(--muted-foreground)]">
          {new Date(game.createdAt).toLocaleDateString()}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/game/${game.id}` as Route} target="_blank">
            <ArcadeButton variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
            </ArcadeButton>
          </Link>
          {game.isHidden ? (
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={() => onUnhideClick(game.id)}
              disabled={isUnhiding}
            >
              {isUnhiding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </ArcadeButton>
          ) : (
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={() => onHideClick(game)}
            >
              <EyeOff className="h-4 w-4" />
            </ArcadeButton>
          )}
        </div>
      </td>
    </tr>
  );
}
