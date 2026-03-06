"use client";

import type { Route } from "next";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Gamepad2, Star, Zap, Play } from "lucide-react";
import { MagazineHeader, GamesSection } from "@/components/profile/magazine";
import { PublicCollectionsCard } from "@/components/profile/public-collections-card";
import { StatBlock } from "@/components/profile/shared";
import type {
  GameWithRanking,
  Prompt,
  PublicCollectionListItem,
  Rating,
  UserProfile,
} from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface MagazineProfileClientProps {
  user: UserProfile;
  prompts: Prompt[];
  gamesWithRankings: GameWithRanking[];
  gamesTotal: number;
  gamesPage: number;
  gamesHasMore: boolean;
  totalPages: number;
  ratings: Rating[];
  publicCollections: PublicCollectionListItem[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export default function MagazineProfileClient({
  user,
  prompts,
  gamesWithRankings,
  gamesTotal,
  gamesPage,
  gamesHasMore,
  totalPages,
  ratings,
  publicCollections,
  stats,
  isOwnProfile,
}: MagazineProfileClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handlePageChange = (newPage: number) => {
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

        <GamesSection
          games={gamesWithRankings}
          page={gamesPage}
          total={gamesTotal}
          hasMore={gamesHasMore}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <div className="mb-16">
          <PublicCollectionsCard collections={publicCollections} />
        </div>
      </div>
    </div>
  );
}
