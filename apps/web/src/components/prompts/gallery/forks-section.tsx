import type { PromptListForksByPromptOutput } from "@/lib/trpc-types";

import { GitFork } from "lucide-react";

import { ForkCard } from "@/components/prompts/shared";

type ForkItem = PromptListForksByPromptOutput[number];

export interface ForksSectionProps {
  forks: ForkItem[];
}

export function ForksSection({ forks }: ForksSectionProps) {
  if (forks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <GitFork className="h-5 w-5 text-[var(--muted-foreground)]" />
        <h2 className="text-xl font-bold">Forks</h2>
      </div>
      <p className="text-[var(--muted-foreground)] mb-6">
        Other creators who have forked this prompt.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {forks.map((fork) => (
          <ForkCard key={fork.id} fork={fork} />
        ))}
      </div>
    </section>
  );
}
