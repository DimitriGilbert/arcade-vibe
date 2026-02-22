"use client";

import { Gamepad2, Star, Zap, Play } from "lucide-react";
import { MagazineHeader, GamesSection, ActivityFeed } from "@/components/profile/magazine";
import { StatBlock } from "@/components/profile/shared";
import type { GameWithRanking, Prompt, Rating, UserProfile } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface MagazineProfileClientProps {
  user: UserProfile;
  prompts: Prompt[];
  gamesWithRankings: GameWithRanking[];
  ratings: Rating[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export default function MagazineProfileClient({
  user,
  prompts,
  gamesWithRankings,
  ratings,
  stats,
  isOwnProfile,
}: MagazineProfileClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <MagazineHeader user={user} stats={stats} isOwnProfile={isOwnProfile} />

        {stats && (
          <div className="mb-16">
            <div className="grid grid-cols-4 divide-x divide-[var(--border)] border border-[var(--border)] rounded-lg bg-[var(--card)]">
              <StatBlock label="Games" value={stats.gamesCreated} icon={Gamepad2} />
              <StatBlock label="Ratings" value={stats.totalRatings} icon={Star} />
              <StatBlock label="Prompts" value={stats.promptsCount} icon={Zap} />
              <StatBlock label="Runs" value={stats.promptRuns} icon={Play} />
            </div>
          </div>
        )}

        <GamesSection games={gamesWithRankings} />

        <ActivityFeed ratings={ratings} prompts={prompts} />
      </div>
    </div>
  );
}
