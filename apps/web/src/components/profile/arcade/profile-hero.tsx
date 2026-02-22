"use client";

import { Crown, Medal } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import type { UserProfile } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

export interface ProfileHeroProps {
  user: UserProfile;
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export function ProfileHero({ user, stats, isOwnProfile }: ProfileHeroProps) {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/10 via-transparent to-transparent rounded-3xl" />

      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 p-8">
        <div className="relative">
          <div className="absolute -inset-2 bg-[var(--primary)]/20 rounded-full blur-xl" />
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="relative w-28 h-28 rounded-full border-4 border-[var(--primary)] shadow-2xl object-cover"
            />
          ) : (
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] text-4xl font-bold shadow-2xl">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          {stats && stats.reputation >= 100 && (
            <div className="absolute -bottom-1 -right-1 bg-[var(--accent)] rounded-full p-2 shadow-lg">
              <Crown className="w-5 h-5 text-[var(--accent-foreground)]" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
              {user.name}
            </h1>
            <div className="flex justify-center md:justify-start gap-2">
              <ArcadeBadge text={`Est. ${new Date(user.createdAt).getFullYear()}`} variant="default" />
              {stats && stats.reputation >= 50 && (
                <ArcadeBadge text="Veteran" variant="neon" icon={<Medal className="w-3 h-3" />} />
              )}
              {isOwnProfile && stats && (
                <ArcadeBadge text={`${stats.credits} credits`} variant="neon" />
              )}
            </div>
          </div>

          {stats && (
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--primary)]">{stats.gamesCreated}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Games</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">{stats.reputation}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Rep</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--secondary)]">{stats.totalRatings}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Ratings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--foreground)]">{stats.promptRuns}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Runs</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
