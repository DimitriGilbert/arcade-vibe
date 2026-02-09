"use client";

import React, { useEffect, useMemo, useState } from "react";
import { User as UserIcon, AlertCircle, Trophy, Zap } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import { StatsCard } from "./components/stats-card";
import { PromptList } from "./components/prompt-list";
import { ProfileHeader } from "./components/profile-header";
import { GamesListCard } from "./components/games-list-card";
import { RatingsHistoryCard } from "./components/ratings-history-card";
import { PromptRunsCard } from "./components/prompt-runs-card";
import { useProfileData } from "@/hooks/use-profile-data";
import { type UserProfile } from "@/types/entities";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import EmptyPlaceholder from "@/components/reusable/empty-placeholder";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [username, setUsername] = useState<string>("");
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setUsername(resolvedParams.username);
    });
  }, [params]);

  const {
    user,
    userExtended,
    prompts,
    userGamesWithRankings,
    ratings,
    promptRunsHistory,
    stats,
    isOwnProfile: computedIsOwnProfile,
    userEmail,
    userLoading,
    promptsLoading,
    gamesLoading,
    ratingsLoading,
    promptRunsLoading,
  } = useProfileData(username, isOwnProfile);

  useEffect(() => {
    const checkOwnProfile = async () => {
      if (!user?.id) return;

      try {
        const sessionResponse = await fetch("/api/auth/getSession", {
          credentials: "include",
        });

        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          const currentUserId = session?.user?.id;
          setIsOwnProfile(currentUserId === user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkOwnProfile();
  }, [user?.id]);

  if (userLoading || (!user && !userLoading)) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="container mx-auto py-8 px-4">
          <LoadingPlaceholder />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="container mx-auto py-8 px-4">
          <ArcadeCard className="">
            <div className="p-20 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-[var(--destructive)] mb-4 opacity-70" />
              <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                User Not Found
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                The profile could not be found.
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Please check the username and try again, or contact support if
                the problem persists.
              </p>
            </div>
          </ArcadeCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto py-8 px-4">
        <ProfileHeader
          user={user}
          credits={stats ? { balance: stats.credits } : null}
          isOwnProfile={computedIsOwnProfile}
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
              isLoading={gamesLoading || ratingsLoading}
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
              <PromptList prompts={prompts || []} isLoading={promptsLoading} />
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
                games={userGamesWithRankings}
                isLoading={gamesLoading}
              />
            </div>
          </ArcadeCard>
        </div>

        <div className="mt-8 space-y-6">
          <RatingsHistoryCard
            ratings={ratings || []}
            isLoading={ratingsLoading}
          />
          <PromptRunsCard
            promptRuns={promptRunsHistory || []}
            isLoading={promptRunsLoading}
          />
        </div>
      </div>
    </div>
  );
}
