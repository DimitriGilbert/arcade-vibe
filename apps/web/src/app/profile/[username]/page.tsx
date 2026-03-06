import { AlertCircle } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@arcade-vibe/auth";
import { db } from "@arcade-vibe/db";
import {
  DEFAULT_PROFILE_IMPLEMENTATION_PREFERENCE,
  userPreferences,
} from "@arcade-vibe/db/schema/user-preferences";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ArcadeCard } from "@/components/arcade";
import { getProfileData } from "@/lib/profile-data";
import { getServerCaller } from "@/utils/trpc-server";
import ProfilePageClient from "./profile-page-client";

const PAGE_SIZE = 20;

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    promptsPage?: string;
    gamesPage?: string;
  }>;
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const { promptsPage: promptsPageParam, gamesPage: gamesPageParam } = await searchParams;
  const promptsPage = Math.max(1, parseInt(promptsPageParam ?? "1", 10) || 1);
  const gamesPage = Math.max(1, parseInt(gamesPageParam ?? "1", 10) || 1);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.id) {
    const preferences = await db.query.userPreferences.findFirst({
      where: and(
        eq(userPreferences.userId, session.user.id),
        eq(userPreferences.name, DEFAULT_PROFILE_IMPLEMENTATION_PREFERENCE),
      ),
      columns: {
        value: true,
      },
    });

    switch (preferences?.value) {
      case "dashboard":
        redirect(`/profile/dashboard/${username}`);
      case "magazine":
        redirect(`/profile/magazine/${username}`);
      case "arcade":
        redirect(`/profile/arcade/${username}`);
      default:
        break;
    }
  }

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

  const promptsTotalPages = Math.ceil(promptsTotal / PAGE_SIZE);
  const gamesTotalPages = Math.ceil(gamesTotal / PAGE_SIZE);

  return (
    <ProfilePageClient
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
