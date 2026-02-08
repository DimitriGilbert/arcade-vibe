"use client";

import React, { useEffect, useMemo, useState } from "react";
import { User as UserIcon, AlertCircle, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./components/stats-card";
import { PromptList } from "./components/prompt-list";
import { ProfileHeader } from "./components/profile-header";
import { GamesListCard } from "./components/games-list-card";
import { RatingsHistoryCard } from "./components/ratings-history-card";
import { PromptRunsCard } from "./components/prompt-runs-card";
import { useProfileData } from "@/hooks/use-profile-data";
import { type User } from "@/types/entities";
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <LoadingPlaceholder />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Card className="bg-card border-border">
            <CardContent className="p-20 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4 opacity-70" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                User Not Found
              </h3>
              <p className="text-muted-foreground mb-4">
                The profile {userEmail} could not be found.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check the username and try again, or contact support if the problem persists.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <ProfileHeader
          user={user}
          userEmail={userEmail}
          credits={stats ? { balance: stats.credits } : null}
          isOwnProfile={computedIsOwnProfile}
        />

        {stats && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Prompts Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PromptList prompts={prompts || []} isLoading={promptsLoading} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Games & Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GamesListCard
                games={userGamesWithRankings}
                isLoading={gamesLoading}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 space-y-6">
          <RatingsHistoryCard ratings={ratings || []} isLoading={ratingsLoading} />
          <PromptRunsCard promptRuns={promptRunsHistory || []} isLoading={promptRunsLoading} />
        </div>
      </div>
    </div>
  );
}
