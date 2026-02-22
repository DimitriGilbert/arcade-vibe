import type { PromptListGamesByPromptOutput } from "@/lib/trpc-types";

import { Trophy } from "lucide-react";

import { PodiumCard } from "./podium-card";

type GameItem = PromptListGamesByPromptOutput["items"][number];

export interface TopGamesSectionProps {
  top3: GameItem[];
}

export function TopGamesSection({ top3 }: TopGamesSectionProps) {
  if (top3.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-[var(--accent)]" />
        <h2 className="text-2xl font-bold">Top Games</h2>
      </div>
      <p className="text-[var(--muted-foreground)] mb-8">
        These are the highest-scoring games generated from this prompt.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3[1] && <PodiumCard game={top3[1]} rank={2} />}
        {top3[0] && <PodiumCard game={top3[0]} rank={1} isCenter />}
        {top3[2] && <PodiumCard game={top3[2]} rank={3} />}
      </div>
    </section>
  );
}
