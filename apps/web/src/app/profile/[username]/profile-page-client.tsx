"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Trophy } from "lucide-react";
import { StatsCard } from "@/components/profile/stats-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PromptsPanel, GamesPanel } from "@/components/profile/shared";
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
  promptsTotal: number;
  promptsPage: number;
  promptsHasMore: boolean;
  promptsTotalPages: number;
  gamesWithRankings: GameWithRanking[];
  gamesTotal: number;
  gamesPage: number;
  gamesHasMore: boolean;
  gamesTotalPages: number;
  ratings: Rating[];
  publicCollections: PublicCollectionListItem[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export default function ProfilePageClient({
  user,
  prompts,
  promptsTotal,
  promptsPage,
  promptsHasMore,
  promptsTotalPages,
  gamesWithRankings,
  gamesTotal,
  gamesPage,
  gamesHasMore,
  gamesTotalPages,
  ratings,
  publicCollections,
  stats,
  isOwnProfile,
}: ProfilePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePromptsPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("promptsPage", String(page));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleGamesPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("gamesPage", String(page));
    router.push(`?${params.toString()}`, { scroll: false });
  };

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
          <PromptsPanel
            prompts={prompts}
            total={promptsTotal}
            page={promptsPage}
            hasMore={promptsHasMore}
            totalPages={promptsTotalPages}
            onPageChange={handlePromptsPageChange}
          />

          <GamesPanel
            games={gamesWithRankings}
            total={gamesTotal}
            page={gamesPage}
            hasMore={gamesHasMore}
            totalPages={gamesTotalPages}
            onPageChange={handleGamesPageChange}
          />
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
