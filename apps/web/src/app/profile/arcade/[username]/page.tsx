import { AlertCircle, Trophy, Zap, Gamepad2, Target } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@arcade-vibe/auth";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { getProfileData } from "@/lib/profile-data";
import ArcadeProfileClient from "./arcade-profile-client";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ArcadeCabinetProfile({ params }: ProfilePageProps) {
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

  const { user, gamesWithRankings, ratings, stats, isOwnProfile } = profileData;

  return (
    <ArcadeProfileClient
      user={user}
      gamesWithRankings={gamesWithRankings}
      ratings={ratings}
      stats={stats}
      isOwnProfile={isOwnProfile}
    />
  );
}
