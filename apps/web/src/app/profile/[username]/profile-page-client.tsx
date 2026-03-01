"use client";

import { Trophy, Zap } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import { StatsCard } from "@/components/profile/stats-card";
import { PromptList } from "@/components/profile/prompt-list";
import { ProfileHeader } from "@/components/profile/profile-header";
import { GamesListCard } from "@/components/profile/games-list-card";
import { RatingsHistoryCard } from "@/components/profile/ratings-history-card";
import { PublicCollectionsCard } from "@/components/profile/public-collections-card";
import type {
  GameWithRanking,
  Prompt,
  PublicCollectionListItem,
  Rating,
  UserProfile,
} from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface ProfilePageClientProps {
  user: UserProfile;
  prompts: Prompt[];
  gamesWithRankings: GameWithRanking[];
  ratings: Rating[];
  publicCollections: PublicCollectionListItem[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export default function ProfilePageClient({
  user,
  prompts,
  gamesWithRankings,
  ratings,
  publicCollections,
  stats,
  isOwnProfile,
}: ProfilePageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <ProfileHeader
          user={user}
          credits={stats ? { balance: stats.credits } : null}
          isOwnProfile={isOwnProfile}
        />

        {stats && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-2xl font-bold">Statistics Overview</h2>
            </div>
            <StatsCard
              gamesCreated={stats.gamesCreated}
              totalRatings={stats.totalRatings}
              reputation={stats.reputation}
              promptRuns={stats.promptRuns}
              isLoading={false}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <ArcadeCard className="">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Zap className="h-5 w-5 text-[var(--primary)]" />
                Prompts Created
              </h3>
            </div>
            <div className="p-4">
              <PromptList prompts={prompts || []} isLoading={false} />
            </div>
          </ArcadeCard>

          <ArcadeCard className="">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[var(--primary)]" />
                Games & Rankings
              </h3>
            </div>
            <div className="p-4">
              <GamesListCard
                games={gamesWithRankings}
                isLoading={false}
              />
            </div>
          </ArcadeCard>
        </div>

        <div className="mt-8 space-y-6">
          <PublicCollectionsCard collections={publicCollections} />
          <RatingsHistoryCard
            ratings={ratings || []}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}
