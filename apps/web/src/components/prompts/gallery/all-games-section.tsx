import type { PromptListGamesByPromptOutput } from "@/lib/trpc-types";

import { Gamepad2 } from "lucide-react";

import { ArcadeCard } from "@/components/arcade";
import { GameRow } from "@/components/prompts/shared";

type GameItem = PromptListGamesByPromptOutput["items"][number];

export interface AllGamesSectionProps {
  games: GameItem[];
  startRank?: number;
}

export function AllGamesSection({ games, startRank = 4 }: AllGamesSectionProps) {
  if (games.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Gamepad2 className="h-5 w-5 text-[var(--muted-foreground)]" />
        <h2 className="text-xl font-bold">All Games</h2>
      </div>

      <ArcadeCard>
        <div className="divide-y divide-[var(--border)]">
          {games.map((game, idx) => (
            <GameRow key={game.id} game={game} rank={idx + startRank} />
          ))}
        </div>
      </ArcadeCard>
    </section>
  );
}
