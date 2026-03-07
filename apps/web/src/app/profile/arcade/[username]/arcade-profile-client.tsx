"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2, Target } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import { ProfileHero, AllGamesGrid } from "@/components/profile/arcade";
import { ProfileViewSwitcher } from "@/components/profile/profile-view-switcher";
import { PublicCollectionsCard } from "@/components/profile/public-collections-card";
import { QuickStats } from "@/components/profile/shared/quick-stats";
import type {
  GameWithRanking,
  PublicCollectionListItem,
  Rating,
  UserProfile,
} from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface ArcadeProfileClientProps {
  user: UserProfile;
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

export default function ArcadeProfileClient({
  user,
  gamesWithRankings,
  gamesTotal,
  gamesPage,
  gamesHasMore,
  gamesTotalPages,
  ratings,
  publicCollections,
  stats,
  isOwnProfile,
}: ArcadeProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-end mb-4">
          <ProfileViewSwitcher username={user.name} currentView="arcade" />
        </div>

        <ProfileHero user={user} stats={stats} isOwnProfile={isOwnProfile} />

        {stats && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--primary)]" />
              Quick Stats
            </h2>
            <QuickStats
              stats={stats}
              games={gamesWithRankings}
              ratings={ratings}
            />
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
            Games
            <ArcadeBadge text={String(gamesTotal)} variant="default" />
          </h2>
          <AllGamesGrid
            games={gamesWithRankings}
            total={gamesTotal}
            page={gamesPage}
            hasMore={gamesHasMore}
            totalPages={gamesTotalPages}
            onPageChange={handlePageChange}
          />
        </section>

        <section className="mt-12">
          <PublicCollectionsCard collections={publicCollections} />
        </section>
      </div>
    </div>
  );
}
