import { AlertCircle } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@arcade-vibe/auth";
import { ArcadeCard } from "@/components/arcade";
import { getProfileData } from "@/lib/profile-data";
import { getServerCaller } from "@/utils/trpc-server";
import ProfilePageClient from "./profile-page-client";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const profileData = await getProfileData(username, session?.user?.id ?? null);

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

  const { user, prompts, gamesWithRankings, ratings, stats, isOwnProfile } =
    profileData;
  const caller = await getServerCaller();
  const rawPublicCollections = await caller.collections.listPublicByUser({
    userId: user.id,
  });
  const publicCollections = rawPublicCollections.map((collection) => ({
    ...collection,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  }));

  return (
    <ProfilePageClient
      user={user}
      prompts={prompts}
      gamesWithRankings={gamesWithRankings}
      ratings={ratings}
      publicCollections={publicCollections}
      stats={stats}
      isOwnProfile={isOwnProfile}
    />
  );
}
