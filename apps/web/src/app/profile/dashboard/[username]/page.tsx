import { AlertCircle } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@arcade-vibe/auth";
import { ArcadeCard } from "@/components/arcade";
import { getProfileData } from "@/lib/profile-data";
import { trpcClient } from "@/utils/trpc";
import DashboardProfileClient from "./dashboard-profile-client";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function DashboardLayoutProfile({ params }: ProfilePageProps) {
  const { username } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const profileData = await getProfileData(username, session?.user?.id ?? null);

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

  const { user, prompts, gamesWithRankings, ratings, stats, isOwnProfile } = profileData;
  const publicCollections = await trpcClient.collections.listPublicByUser.query({
    userId: user.id,
  });

  return (
    <DashboardProfileClient
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
