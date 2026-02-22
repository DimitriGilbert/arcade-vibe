"use client";

import { TrendingUp, Zap } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { UserProfile } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

export interface MagazineHeaderProps {
  user: UserProfile;
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

export function MagazineHeader({ user, stats, isOwnProfile }: MagazineHeaderProps) {
  return (
    <header className="mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-end gap-6 mb-6">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-32 h-32 rounded-lg border-2 border-[var(--border)] shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] text-5xl font-bold shadow-lg">
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 pb-2">
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Prompt Engineer</p>
              <h1 className="text-5xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-[var(--muted-foreground)] mt-1">Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
              {isOwnProfile
                ? "This is your profile. Your games, prompts, and achievements are showcased here for the community to see."
                : `Explore ${user.name}'s contributions to Arcade Vibe - games created, prompts crafted, and the impact on the community.`
              }
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <ArcadeCard className="p-6">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Reputation Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[var(--primary)]">{stats?.reputation ?? 0}</span>
              <span className="text-sm text-[var(--muted-foreground)]">pts</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-[var(--muted-foreground)]">
              <TrendingUp className="w-4 h-4" />
              <span>Based on community engagement</span>
            </div>
          </ArcadeCard>

          {isOwnProfile && stats && (
            <ArcadeCard className="p-6 bg-gradient-to-br from-[var(--primary)]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Credits</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{stats.credits}</p>
                </div>
                <Zap className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </ArcadeCard>
          )}
        </aside>
      </div>
    </header>
  );
}
