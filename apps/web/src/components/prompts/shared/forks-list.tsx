import Link from "next/link";
import { Users } from "lucide-react";

import { ArcadeBadge } from "@/components/arcade";
import type { PromptListForksByPromptOutput } from "@/lib/trpc-types";

type PromptFork = PromptListForksByPromptOutput[number];

export interface ForksListProps {
  forks: PromptFork[];
}

export function ForksList({ forks }: ForksListProps) {
  if (forks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {forks.map((fork) => (
        <Link
          key={fork.id}
          href={`/prompts/${fork.id}`}
          className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--primary)]/10 rounded-lg">
            <Users className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm truncate">
              {fork.author?.name ?? "Anonymous"}
            </span>
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
              {fork.contentPreview}
              {fork.contentPreview.length >= 150 && "..."}
            </p>
          </div>
          <ArcadeBadge text={`${fork.gameCount} games`} variant="default" />
        </Link>
      ))}
    </div>
  );
}
