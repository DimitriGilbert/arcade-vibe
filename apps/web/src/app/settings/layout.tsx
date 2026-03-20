"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Key, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Overview", href: "/settings", icon: LayoutDashboard },
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "API Keys", href: "/settings/api-keys", icon: Key },
  { name: "Subscription", href: "/settings/subscription", icon: CreditCard },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--primary)] mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Determine active tab
  const getActiveTab = () => {
    if (pathname === "/settings") return "/settings";
    const matchingItem = navigationItems.find(
      (item) => item.href !== "/settings" && pathname?.startsWith(item.href),
    );
    return matchingItem?.href ?? "/settings";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Tab Navigation */}
      <div className="border-b border-[var(--border)] bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] rounded-lg">
                <LayoutDashboard className="h-5 w-5 text-[var(--primary-foreground)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  Settings
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Manage your account
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/40 p-1 overflow-x-auto flex-nowrap max-w-full">
              {navigationItems.map((item) => {
                const isActive = getActiveTab() === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius)-4px)] px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info - Desktop */}
            {user && (
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-sm font-medium">
                  {user.name?.[0] ?? "U"}
                </div>
                <div className="flex-1 min-w-0 max-w-[200px]">
                  <p className="text-sm font-medium truncate">
                    {user.name ?? "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <main className="container mx-auto p-4 lg:p-8">{children}</main>
    </div>
  );
}
