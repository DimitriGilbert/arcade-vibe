import { AlertCircle } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@arcade-vibe/auth";
import { ArcadeCard } from "@/components/arcade";
import { getProfileData } from "@/lib/profile-data";
import { getServerCaller } from "@/utils/trpc-server";
import DashboardProfileClient from "./dashboard-profile-client";

const PAGE_SIZE = 20;

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    page?: string;
    promptsPage?: string;
  }>;
}

export default async function DashboardLayoutProfile({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const { page: pageParam, promptsPage: promptsPageParam } = await searchParams;
  const gamesPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const promptsPage = Math.max(1, parseInt(promptsPageParam ?? "1", 10) || 1);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const profileData = await getProfileData(
    username,
    session?.user?.id ?? null,
    gamesPage,
    PAGE_SIZE,
    promptsPage,
    PAGE_SIZE
  );

  if (!profileData.user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <ArcadeCard className="p-20 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-[var(--destructive)] mb-4 opacity-70" />
            <h3 className="text-xl font-semibold mb-2">User Not Found</h3>
            <p className="text-[var(--muted-foreground)]">The profile could not be found.</p>
          </ArcadeCard>
        </div>
      </div>
    );
  }

  const {
    user,
    prompts,
    promptsTotal,
    promptsPage: currentPromptsPage,
    promptsHasMore,
    gamesWithRankings,
    gamesTotal,
    gamesPage: currentGamesPage,
    gamesHasMore,
    ratings,
    stats,
    isOwnProfile,
  } = profileData;
  const caller = await getServerCaller();
  const rawPublicCollections = await caller.collections.listPublicByUser({
    userId: user.id,
  });
  const publicCollections = rawPublicCollections.map((collection) => ({
    ...collection,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  }));

  const gamesTotalPages = Math.ceil(gamesTotal / PAGE_SIZE);
  const promptsTotalPages = Math.ceil(promptsTotal / PAGE_SIZE);

  return (
    <DashboardProfileClient
      user={user}
      prompts={prompts}
      promptsTotal={promptsTotal}
      promptsPage={currentPromptsPage}
      promptsHasMore={promptsHasMore}
      promptsTotalPages={promptsTotalPages}
      gamesWithRankings={gamesWithRankings}
      gamesTotal={gamesTotal}
      gamesPage={currentGamesPage}
      gamesHasMore={gamesHasMore}
      gamesTotalPages={gamesTotalPages}
      ratings={ratings}
      publicCollections={publicCollections}
      stats={stats}
      isOwnProfile={isOwnProfile}
    />
  );
}
