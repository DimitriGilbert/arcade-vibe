"use client";

import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import { ArcadeButton } from "@/components/arcade";
import {
  User,
  Key,
  CreditCard,
  ArrowRight,
  Coins,
  TrendingUp,
  Shield,
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
      <ArcadeCard className="group hover:shadow-lg transition-all cursor-pointer">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-[var(--muted-foreground)]">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Overview */}
      <ArcadeCard className="">
        <div className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-2xl font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
              <p className="text-[var(--muted-foreground)]">{user?.email}</p>
            </div>
          </div>
        </div>
      </ArcadeCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ArcadeCard className="">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--muted)]/60 rounded-lg">
                <Coins className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--accent)]">
                  {credits}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Credits Available
                </p>
              </div>
            </div>
          </div>
        </ArcadeCard>

        <ArcadeCard className="">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--muted)]/60 rounded-lg">
                <TrendingUp className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--primary)]">
                  {reputation}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Reputation
                </p>
              </div>
            </div>
          </div>
        </ArcadeCard>

        <ArcadeCard className="">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--muted)]/60 rounded-lg">
                <Shield className="h-6 w-6 text-[var(--secondary)]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--secondary)]">
                  {apiKeysCount}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  API Keys
                </p>
              </div>
            </div>
          </div>
        </ArcadeCard>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </div>

      {/* Quick Actions */}
      <ArcadeCard className="">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">
            Need More Credits?
          </h3>
        </div>
        <div className="p-4">
          <p className="text-[var(--muted-foreground)] mb-4">
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
      </ArcadeCard>
    </div>
  );
}
