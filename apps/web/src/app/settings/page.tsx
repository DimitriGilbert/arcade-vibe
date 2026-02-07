"use client";

import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function SettingsSection({ title, description, icon, href, badge }: SettingsSectionProps) {
  return (
    <Link href={href as Route}>
      <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-200 dark:hover:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{title}</h3>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
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
  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    queryKey: ["apiKeys", "list"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
  });

  if (creditsLoading || userLoading || isPending) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
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
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Overview */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg">
                <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{credits}</p>
                <p className="text-sm text-muted-foreground">Credits Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reputation}</p>
                <p className="text-sm text-muted-foreground">Reputation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{apiKeysCount}</p>
                <p className="text-sm text-muted-foreground">API Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSection
            title="Profile"
            description="Update your username and email"
            icon={<User className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            href="/settings/profile"
          />

          <SettingsSection
            title="API Keys"
            description="Manage your BYOK (Bring Your Own Key) API keys"
            icon={<Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            href="/settings/api-keys"
            badge={apiKeysCount > 0 ? `${apiKeysCount} keys` : undefined}
          />

          <SettingsSection
            title="Subscription"
            description="View your plan and purchase credits"
            icon={<CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            href="/settings/subscription"
            badge={`${credits} credits`}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle>Need More Credits?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Purchase additional credits to continue generating games and participating in the arcade.
          </p>
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => {
              window.location.href = "/settings/subscription";
            }}
          >
            Purchase Credits
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
