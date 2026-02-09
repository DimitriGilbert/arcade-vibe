"use client";

import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  User,
  Key,
  CreditCard,
  ArrowRight,
  Coins,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

function SettingsSection({
  title,
  description,
  icon,
  href,
  badge,
}: SettingsSectionProps) {
  return (
    <Link href={href as Route}>
      <ArcadeCard className="group hover:shadow-lg transition-all cursor-pointer h-full">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--muted)]/60 rounded-lg group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{title}</h3>
                {badge && <ArcadeBadge text={badge} variant="default" />}
              </div>
              <p className="text-[var(--muted-foreground)] text-sm">
                {description}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </ArcadeCard>
    </Link>
  );
}

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  // Fetch user credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  // Fetch user extended data (includes reputation)
  const { data: userExtended, isLoading: userLoading } = useQuery({
    queryKey: ["user", "extended"],
    queryFn: () => trpcClient.credits.getUserExtended.query(),
  });

  // Fetch API keys count
  const { data: apiKeys } = useQuery({
    queryKey: ["apiKeys", "list"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
  });

  if (creditsLoading || userLoading || isPending) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-[var(--muted)]/60 rounded mb-4" />
          <div className="h-4 w-96 bg-[var(--muted)]/60 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-[var(--muted)]/60 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const credits = creditsData?.balance ?? 0;
  const reputation = userExtended?.reputation ?? 0;
  const apiKeysCount = apiKeys?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Overview</h1>
        <p className="text-[var(--muted-foreground)]">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Bento Grid - Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reputation - First (1/4) */}
        <ArcadeCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent" />
          <div className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-[var(--primary)]/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Reputation
              </span>
            </div>
            <p className="text-4xl font-bold text-[var(--primary)]">
              {reputation}
            </p>
          </div>
        </ArcadeCard>

        {/* Credits (1/4) */}
        <ArcadeCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent" />
          <div className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-[var(--accent)]/20 rounded-lg">
                <Coins className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Credits
              </span>
            </div>
            <p className="text-4xl font-bold text-[var(--accent)]">{credits}</p>
          </div>
        </ArcadeCard>

        {/* API Keys (1/4) */}
        <ArcadeCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--secondary)]/10 to-transparent" />
          <div className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-[var(--secondary)]/20 rounded-lg">
                <Key className="h-5 w-5 text-[var(--secondary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                API Keys
              </span>
            </div>
            <p className="text-4xl font-bold text-[var(--secondary)]">
              {apiKeysCount}
            </p>
          </div>
        </ArcadeCard>

        {/* User Card (1/4) */}
        <ArcadeCard className="relative overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xl font-bold">
                {user?.name?.[0] ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.name ?? "User"}</p>
                <p className="text-sm text-[var(--muted-foreground)] truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </ArcadeCard>
      </div>

      {/* Settings Sections - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SettingsSection
          title="Profile"
          description="Update your username and email"
          icon={<User className="h-6 w-6 text-[var(--primary)]" />}
          href="/settings/profile"
        />

        <SettingsSection
          title="API Keys"
          description="Manage your BYOK (Bring Your Own Key) API keys"
          icon={<Key className="h-6 w-6 text-[var(--primary)]" />}
          href="/settings/api-keys"
          badge={apiKeysCount > 0 ? `${apiKeysCount} keys` : undefined}
        />

        <SettingsSection
          title="Subscription"
          description="View your plan and purchase credits"
          icon={<CreditCard className="h-6 w-6 text-[var(--primary)]" />}
          href="/settings/subscription"
          badge={`${credits} credits`}
        />

        {/* Quick Actions Card */}
        <ArcadeCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-[var(--accent)]/5 to-transparent" />
          <div className="p-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--accent)]/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Need More Credits?
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-4">
                  Purchase additional credits to continue generating games and
                  participating in the arcade.
                </p>
                <ArcadeButton
                  variant="primary"
                  onClick={() => {
                    window.location.href = "/settings/subscription";
                  }}
                >
                  Purchase Credits
                </ArcadeButton>
              </div>
            </div>
          </div>
        </ArcadeCard>
      </div>
    </div>
  );
}
