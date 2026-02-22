"use client";

import {
  PlayerCard,
  RatingsPanel,
  PromptsPanel,
} from "@/components/profile/shared";
import { GamesPanel, StatsOverview } from "@/components/profile/dashboard";
import type { GameWithRanking, Prompt, Rating, UserProfile } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface DashboardProfileClientProps {
  user: UserProfile;
  prompts: Prompt[];
  gamesWithRankings: GameWithRanking[];
  ratings: Rating[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export default function DashboardProfileClient({
  user,
  prompts,
  gamesWithRankings,
  ratings,
  stats,
  isOwnProfile,
}: DashboardProfileClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <PlayerCard user={user} stats={stats} isOwnProfile={isOwnProfile} />
          </div>

          {stats && (
            <div className="lg:col-span-12">
              <StatsOverview stats={stats} games={gamesWithRankings} ratings={ratings} />
            </div>
          )}

          <div className="lg:col-span-8">
            <GamesPanel games={gamesWithRankings} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <RatingsPanel ratings={ratings} />
            <PromptsPanel prompts={prompts} />
          </div>
        </div>
      </div>
    </div>
  );
}
