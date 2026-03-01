import type { Route } from "next";
import Link from "next/link";
import { Play } from "lucide-react";

export interface GameLinkProps {
  game: {
    id: string;
    name: string;
  };
  showPlayButton?: boolean;
}

export function GameLink({ game, showPlayButton = false }: GameLinkProps) {
  const href = `/games/${game.id}` as Route;

  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors"
    >
      <span>{game.name}</span>
      {showPlayButton && (
        <Play className="size-3.5" aria-hidden="true" />
      )}
    </Link>
  );
}
