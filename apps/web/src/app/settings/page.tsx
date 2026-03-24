"use client";

import type { Route } from "next";
import type {
  CreatorImplementation,
  LeaderboardImplementation,
  ProfileImplementation,
} from "@/lib/trpc-types";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Key,
  CreditCard,
  ArrowRight,
  Coins,
  TrendingUp,
  Sparkles,
  PanelsTopLeft,
  Loader2,
  Shield,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { AccountManagementCard } from "@/components/settings/account-management-card";
import { Switch } from "@/components/ui/switch";

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
    <Link href={href as Route} className="h-full">
      <ArcadeCard className="group hover:shadow-lg transition-all cursor-pointer h-full">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--muted)]/60 rounded-lg group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {badge && <ArcadeBadge text={badge} variant="default" />}
              </div>
              <p className="text-[var(--muted-foreground)] text-sm truncate">
                {description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </div>
      </ArcadeCard>
    </Link>
  );
}

const NO_DEFAULT_VALUE = "manual-choice";
const LEADERBOARD_IMPLEMENTATIONS: readonly LeaderboardImplementation[] = [
  "arena",
  "dashboard",
  "magazine",
];
const CREATOR_IMPLEMENTATIONS: readonly CreatorImplementation[] = [
  "ide",
  "workbench",
  "inbox",
  "filebrowser",
];
const PROFILE_IMPLEMENTATIONS: readonly ProfileImplementation[] = [
  "classic",
  "dashboard",
  "magazine",
  "arcade",
];

const leaderboardImplementationLabels: Record<
  LeaderboardImplementation,
  string
> = {
  arena: "Arena",
  dashboard: "Dashboard",
  magazine: "Magazine",
};

const creatorImplementationLabels: Record<CreatorImplementation, string> = {
  ide: "IDE",
  workbench: "Workbench",
  inbox: "Inbox",
  filebrowser: "File Browser",
};

const profileImplementationLabels: Record<ProfileImplementation, string> = {
  classic: "Classic",
  dashboard: "Dashboard",
  magazine: "Magazine",
  arcade: "Arcade",
};

function getSelectValue(value: string | null | undefined): string {
  return value ?? NO_DEFAULT_VALUE;
}

function getLeaderboardSelectLabel(
  value: LeaderboardImplementation | null,
): string {
  return value === null ? "Always ask me" : leaderboardImplementationLabels[value];
}

function getCreatorSelectLabel(value: CreatorImplementation | null): string {
  return value === null ? "Always ask me" : creatorImplementationLabels[value];
}

function getProfileSelectLabel(value: ProfileImplementation | null): string {
  return value === null ? "Always ask me" : profileImplementationLabels[value];
}

function hasPreferencesChanged(
  nextLeaderboardImplementation: LeaderboardImplementation | null,
  nextCreatorImplementation: CreatorImplementation | null,
  nextProfileImplementation: ProfileImplementation | null,
  nextCreatorIdeHintsEnabled: boolean,
  currentLeaderboardImplementation: LeaderboardImplementation | null,
  currentCreatorImplementation: CreatorImplementation | null,
  currentProfileImplementation: ProfileImplementation | null,
  currentCreatorIdeHintsEnabled: boolean,
): boolean {
  return (
    nextLeaderboardImplementation !== currentLeaderboardImplementation ||
    nextCreatorImplementation !== currentCreatorImplementation ||
    nextProfileImplementation !== currentProfileImplementation ||
    nextCreatorIdeHintsEnabled !== currentCreatorIdeHintsEnabled
  );
}

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const queryClient = useQueryClient();

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

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["user", "preferences"],
    queryFn: () => trpcClient.user.getPreferences.query(),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (input: {
      defaultLeaderboardImplementation: LeaderboardImplementation | null;
      defaultCreatorImplementation: CreatorImplementation | null;
      defaultProfileImplementation: ProfileImplementation | null;
      creatorIdeHintsEnabled: boolean;
    }) => trpcClient.user.updatePreferences.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user", "preferences"],
      });
      toast.success("Preferences updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update preferences");
    },
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
  const selectedLeaderboardImplementation =
    preferences?.defaultLeaderboardImplementation ?? null;
  const selectedCreatorImplementation =
    preferences?.defaultCreatorImplementation ?? null;
  const selectedProfileImplementation =
    preferences?.defaultProfileImplementation ?? null;
  const selectedCreatorIdeHintsEnabled =
    preferences?.creatorIdeHintsEnabled ?? true;

  const handleLeaderboardPreferenceChange = (value: string | null) => {
    const nextLeaderboardImplementation =
      value === null || value === NO_DEFAULT_VALUE
        ? null
        : (value as LeaderboardImplementation);

    if (
      !hasPreferencesChanged(
        nextLeaderboardImplementation,
        selectedCreatorImplementation,
        selectedProfileImplementation,
        selectedCreatorIdeHintsEnabled,
        selectedLeaderboardImplementation,
        selectedCreatorImplementation,
        selectedProfileImplementation,
        selectedCreatorIdeHintsEnabled,
      )
    ) {
      return;
    }

    updatePreferencesMutation.mutate({
      defaultLeaderboardImplementation: nextLeaderboardImplementation,
      defaultCreatorImplementation: selectedCreatorImplementation,
      defaultProfileImplementation: selectedProfileImplementation,
      creatorIdeHintsEnabled: selectedCreatorIdeHintsEnabled,
    });
  };

  const handleCreatorPreferenceChange = (value: string | null) => {
    const nextCreatorImplementation =
      value === null || value === NO_DEFAULT_VALUE
        ? null
        : (value as CreatorImplementation);

    if (
      !hasPreferencesChanged(
        selectedLeaderboardImplementation,
        nextCreatorImplementation,
        selectedProfileImplementation,
        selectedCreatorIdeHintsEnabled,
        selectedLeaderboardImplementation,
        selectedCreatorImplementation,
        selectedProfileImplementation,
        selectedCreatorIdeHintsEnabled,
      )
    ) {
      return;
    }

    updatePreferencesMutation.mutate({
      defaultLeaderboardImplementation: selectedLeaderboardImplementation,
      defaultCreatorImplementation: nextCreatorImplementation,
      defaultProfileImplementation: selectedProfileImplementation,
      creatorIdeHintsEnabled: selectedCreatorIdeHintsEnabled,
    });
  };

  const handleProfilePreferenceChange = (value: string | null) => {
    const nextProfileImplementation =
      value === null || value === NO_DEFAULT_VALUE
        ? null
        : (value as ProfileImplementation);

    if (
      !hasPreferencesChanged(
        selectedLeaderboardImplementation,
        selectedCreatorImplementation,
        nextProfileImplementation,
        selectedCreatorIdeHintsEnabled,
        selectedLeaderboardImplementation,
        selectedCreatorImplementation,
        selectedProfileImplementation,
        selectedCreatorIdeHintsEnabled,
      )
    ) {
      return;
    }

    updatePreferencesMutation.mutate({
      defaultLeaderboardImplementation: selectedLeaderboardImplementation,
      defaultCreatorImplementation: selectedCreatorImplementation,
      defaultProfileImplementation: nextProfileImplementation,
      creatorIdeHintsEnabled: selectedCreatorIdeHintsEnabled,
    });
  };

  const handleCreatorIdeHintsChange = (checked: boolean) => {
    if (
      !hasPreferencesChanged(
        selectedLeaderboardImplementation,
        selectedCreatorImplementation,
        selectedProfileImplementation,
        checked,
        selectedLeaderboardImplementation,
        selectedCreatorImplementation,
        selectedProfileImplementation,
        selectedCreatorIdeHintsEnabled,
      )
    ) {
      return;
    }

    updatePreferencesMutation.mutate({
      defaultLeaderboardImplementation: selectedLeaderboardImplementation,
      defaultCreatorImplementation: selectedCreatorImplementation,
      defaultProfileImplementation: selectedProfileImplementation,
      creatorIdeHintsEnabled: checked,
    });
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Landing Preferences - spans 3 rows */}
        <ArcadeCard className="relative overflow-hidden lg:row-span-3 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/6 via-transparent to-[var(--accent)]/12" />
          <div className="absolute right-0 top-0 h-40 w-40 bg-rose-400/10 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-40 w-40 bg-cyan-400/10 blur-3xl" />
          <div className="p-6 relative h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--primary)]/15 rounded-lg">
                    <PanelsTopLeft className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Landing Preferences</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Choose which implementation opens first when you visit
                      `/leaderboard`, `/creator`, or `/profile/[username]`.
                    </p>
                  </div>
                </div>
              </div>
              <ArcadeBadge
                text={
                  selectedLeaderboardImplementation ||
                  selectedCreatorImplementation ||
                  selectedProfileImplementation
                    ? "Active Defaults"
                    : "Always ask me"
                }
                variant="default"
              />
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-xl border border-white/8 bg-black/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-400/10 rounded-lg">
                    <PanelsTopLeft className="h-4 w-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="font-medium">Leaderboard default</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Redirect `/leaderboard` to your preferred view.
                    </p>
                  </div>
                </div>
                <Select
                  value={getSelectValue(selectedLeaderboardImplementation)}
                  onValueChange={handleLeaderboardPreferenceChange}
                  disabled={preferencesLoading || updatePreferencesMutation.isPending}
                >
                  <SelectTrigger className="w-full h-11 px-3 text-sm">
                    <SelectValue placeholder="Always ask me">
                      {getLeaderboardSelectLabel(selectedLeaderboardImplementation)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={NO_DEFAULT_VALUE}>Always ask me</SelectItem>
                    {LEADERBOARD_IMPLEMENTATIONS.map((implementation) => (
                      <SelectItem key={implementation} value={implementation}>
                        {leaderboardImplementationLabels[implementation]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Creator default setting - commented out: Creator menu now links directly to /creator/ide
              <div className="rounded-xl border border-white/8 bg-black/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-400/10 rounded-lg">
                    <WandSparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium">Creator default</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Redirect `/creator` to your preferred editor.
                    </p>
                  </div>
                </div>
                <Select
                  value={getSelectValue(selectedCreatorImplementation)}
                  onValueChange={handleCreatorPreferenceChange}
                  disabled={preferencesLoading || updatePreferencesMutation.isPending}
                >
                  <SelectTrigger className="w-full h-11 px-3 text-sm">
                    <SelectValue placeholder="Always ask me">
                      {getCreatorSelectLabel(selectedCreatorImplementation)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={NO_DEFAULT_VALUE}>Always ask me</SelectItem>
                    {CREATOR_IMPLEMENTATIONS.map((implementation) => (
                      <SelectItem key={implementation} value={implementation}>
                        {creatorImplementationLabels[implementation]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}

              <div className="rounded-xl border border-white/8 bg-black/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/10 rounded-lg">
                    <User className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Profile default</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Redirect `/profile/[username]` to your preferred layout.
                    </p>
                  </div>
                </div>
                <Select
                  value={getSelectValue(selectedProfileImplementation)}
                  onValueChange={handleProfilePreferenceChange}
                  disabled={preferencesLoading || updatePreferencesMutation.isPending}
                >
                  <SelectTrigger className="w-full h-11 px-3 text-sm">
                    <SelectValue placeholder="Always ask me">
                      {getProfileSelectLabel(selectedProfileImplementation)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={NO_DEFAULT_VALUE}>Always ask me</SelectItem>
                    {PROFILE_IMPLEMENTATIONS.map((implementation) => (
                      <SelectItem key={implementation} value={implementation}>
                        {profileImplementationLabels[implementation]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lime-400/10 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-lime-400" />
                  </div>
                  <div>
                    <p className="font-medium">Creator guidance hints</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Show lightweight next-step hints in the IDE creator flow.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/5 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">Hints in `/creator/ide`</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Guide prompt creation, model selection, generation, and publishing.
                    </p>
                  </div>
                  <Switch
                    checked={selectedCreatorIdeHintsEnabled}
                    onCheckedChange={handleCreatorIdeHintsChange}
                    disabled={preferencesLoading || updatePreferencesMutation.isPending}
                    aria-label="Toggle creator guidance hints"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              {updatePreferencesMutation.isPending ? (
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving preferences...</span>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Defaults only apply when you hit the parent route. Direct links still open the specific implementation you asked for.
                </p>
              )}
            </div>
          </div>
        </ArcadeCard>

        {/* Row 1: Profile + Security */}
        <SettingsSection
          title="Profile"
          description="Update your username and email"
          icon={<User className="h-5 w-5 text-[var(--primary)]" />}
          href="/settings/profile"
        />

        <SettingsSection
          title="Security"
          description="Manage password and security"
          icon={<Shield className="h-5 w-5 text-[var(--primary)]" />}
          href="/settings/security"
        />

        {/* Row 2: API Keys + Subscription */}
        <SettingsSection
          title="API Keys"
          description="Manage BYOK API keys"
          icon={<Key className="h-5 w-5 text-[var(--primary)]" />}
          href="/settings/api-keys"
          badge={apiKeysCount > 0 ? `${apiKeysCount} keys` : undefined}
        />

        <SettingsSection
          title="Subscription"
          description="View plan and purchase credits"
          icon={<CreditCard className="h-5 w-5 text-[var(--primary)]" />}
          href="/settings/subscription"
          badge={`${credits} credits`}
        />

        {/* Row 3: Need More Credits - spans 2 columns */}
        <ArcadeCard className="relative overflow-hidden lg:col-span-2 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-[var(--accent)]/5 to-transparent" />
          <div className="p-5 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--accent)]/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-0.5">Need More Credits?</h3>
                <p className="text-[var(--muted-foreground)] text-sm">
                  Purchase additional credits to continue generating games and participating in the arcade.
                </p>
              </div>
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
        </ArcadeCard>

        {/* Row 4: Account Management (GDPR) - spans 3 columns (full width) */}
        <AccountManagementCard />
      </div>
    </div>
  );
}
