"use client";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { Trophy, Medal, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

interface LeaderboardSidebarProps {
  gameId: string;
}

export function LeaderboardSidebar({ gameId }: LeaderboardSidebarProps) {
  // Fetch leaderboard data with polling (NOT subscriptions!)
  const {
    data: leaderboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game-leaderboard", gameId],
    queryFn: async () => {
      return await trpcClient.gameLeaderboard.getLeaderboard.query({
        gameId,
        limit: 50,
      });
    },
    // CRITICAL: Use polling instead of subscriptions since client has no subscription link
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!gameId,
  });

  if (isLoading) {
    return (
      <ArcadeCard>
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        </div>
      </ArcadeCard>
    );
  }

  if (error) {
    return (
      <ArcadeCard>
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            Failed to load leaderboard
          </p>
        </div>
      </ArcadeCard>
    );
  }

  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--accent)]" />
          Leaderboard
        </h3>
      </div>
      <div className="p-4">
        {!leaderboard || leaderboard.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            No scores yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isTop3 ? "bg-[var(--accent)]/10" : "bg-[var(--muted)]/20"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {isTop3 ? (
                      <Medal
                        className={`h-5 w-5 ${
                          rank === 1
                            ? "text-[var(--accent)]"
                            : rank === 2
                              ? "text-[var(--primary)]"
                              : "text-[var(--secondary)]"
                        }`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-[var(--muted-foreground)]">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {entry.user?.name || "Anonymous"}
                      </p>
                      {isTop3 && (
                        <ArcadeBadge
                          text={rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
                          variant="default"
                          className="text-xs px-1.5 py-0.5"
                        />
                      )}
                    </div>
                  </div>

                  {/* Score and Playtime */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{entry.score}</p>
                    </div>
                    {entry.completionTime && (
                      <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Clock className="h-3 w-3" />
                        <span>
                          {Math.floor(entry.completionTime / 60)}:
                          {(entry.completionTime % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ArcadeCard>
  );
}
