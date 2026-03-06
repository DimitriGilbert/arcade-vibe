"use client";

import type { Route } from "next";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  PlayerCard,
  RatingsPanel,
  PromptsPanel,
} from "@/components/profile/shared";
import { PublicCollectionsCard } from "@/components/profile/public-collections-card";
import { GamesPanel, StatsOverview } from "@/components/profile/dashboard";
import type {
  GameWithRanking,
  Prompt,
  PublicCollectionListItem,
  Rating,
  UserProfile,
} from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface DashboardProfileClientProps {
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

export default function DashboardProfileClient({
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
}: DashboardProfileClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleGamesPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url as Route);
  };

  const handlePromptsPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("promptsPage");
    } else {
      params.set("promptsPage", String(newPage));
    }
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url as Route);
  };

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
            <GamesPanel
              games={gamesWithRankings}
              total={gamesTotal}
              page={gamesPage}
              hasMore={gamesHasMore}
              totalPages={gamesTotalPages}
              onPageChange={handleGamesPageChange}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <PublicCollectionsCard collections={publicCollections} />
            <RatingsPanel ratings={ratings} />
            <PromptsPanel
              prompts={prompts}
              total={promptsTotal}
              page={promptsPage}
              hasMore={promptsHasMore}
              totalPages={promptsTotalPages}
              onPageChange={handlePromptsPageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
