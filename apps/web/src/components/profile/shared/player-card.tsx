"use client";

import { Crown, Zap } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { UserProfile } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

export interface PlayerCardProps {
  user: UserProfile;
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export function PlayerCard({ user, stats, isOwnProfile }: PlayerCardProps) {
  return (
    <ArcadeCard className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full blur opacity-40" />
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="relative w-16 h-16 rounded-full border-2 border-[var(--card)] object-cover"
              />
            ) : (
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] text-2xl font-bold">
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{user.name}</h1>
              {stats && stats.reputation >= 100 && (
                <Crown className="w-5 h-5 text-[var(--accent)]" />
              )}
            </div>

            <p className="text-sm text-[var(--muted-foreground)]">
              Est. {new Date(user.createdAt).getFullYear()}
            </p>
          </div>

          {isOwnProfile && stats && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30">
              <Zap className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-bold text-[var(--primary)]">
                {stats.credits}
              </span>
            </div>
          )}
        </div>
      </div>
    </ArcadeCard>
  );
}
