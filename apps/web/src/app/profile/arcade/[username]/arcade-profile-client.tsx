"use client";

import { Trophy, Gamepad2, Target } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import { ProfileHero, TrophyCase, AllGamesGrid } from "@/components/profile/arcade";
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
  ratings: Rating[];
  publicCollections: PublicCollectionListItem[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export default function ArcadeProfileClient({
  user,
  gamesWithRankings,
  ratings,
  publicCollections,
  stats,
  isOwnProfile,
}: ArcadeProfileClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <ProfileHero user={user} stats={stats} isOwnProfile={isOwnProfile} />

        {stats && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--primary)]" />
              Quick Stats
            </h2>
            <QuickStats stats={stats} games={gamesWithRankings} ratings={ratings} />
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--accent)]" />
            Trophy Case
            <ArcadeBadge text={`${gamesWithRankings.filter(g => g.ranking).length} ranked`} variant="default" />
          </h2>
          <TrophyCase games={gamesWithRankings} />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
            All Games
            <ArcadeBadge text={String(gamesWithRankings.length)} variant="default" />
          </h2>
          <AllGamesGrid games={gamesWithRankings} />
        </section>

        <section className="mt-12">
          <PublicCollectionsCard collections={publicCollections} />
        </section>
      </div>
    </div>
  );
}
