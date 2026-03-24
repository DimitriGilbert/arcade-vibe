"use client";

import { useEffect } from "react";

export default function LeaderboardMagazineError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Leaderboard/Magazine] SSR error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-[var(--muted-foreground)]">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
