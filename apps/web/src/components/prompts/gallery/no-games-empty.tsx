"use client";

import { Gamepad2, GitFork } from "lucide-react";

import { ArcadeCard, ArcadeButton } from "@/components/arcade";

interface NoGamesEmptyProps {
  isLoggedIn: boolean;
  onFork: () => void;
  isForking: boolean;
}

export function NoGamesEmpty({ isLoggedIn, onFork, isForking }: NoGamesEmptyProps) {
  return (
    <ArcadeCard className="p-10 text-center">
      <Gamepad2 className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
      <h3 className="text-lg font-bold mb-2">No Games Yet</h3>
      <p className="text-[var(--muted-foreground)] mb-6">
        No completed games have been generated from this prompt yet.
      </p>
      {isLoggedIn && (
        <ArcadeButton variant="primary" onClick={onFork} disabled={isForking}>
          <GitFork className="h-4 w-4" />
          Fork This Prompt
        </ArcadeButton>
      )}
    </ArcadeCard>
  );
}
