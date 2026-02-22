import type { PromptListForksByPromptOutput } from "@/lib/trpc-types";
import type { Route } from "next";

import Link from "next/link";
import { Gamepad2, Calendar } from "lucide-react";

import { ArcadeCard } from "@/components/arcade";

type ForkItem = PromptListForksByPromptOutput[number];

export interface ForkCardProps {
  fork: ForkItem;
}

export function ForkCard({ fork }: ForkCardProps) {
  return (
    <ArcadeCard className="p-4 transition-all duration-200 hover:border-[var(--primary)]/50">
      <div className="flex items-start gap-3">
        {fork.author?.image && (
          <img src={fork.author.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${fork.author?.id}` as Route} className="font-medium hover:text-[var(--primary)]">
            @{fork.author?.name ?? "Anonymous"}
          </Link>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
            {fork.contentPreview}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <Gamepad2 className="h-3 w-3" />
              {fork.gameCount} games
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(fork.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </ArcadeCard>
  );
}
