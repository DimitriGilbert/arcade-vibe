"use client";

import type { Route } from "next";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Key,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="mt-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/settings" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Settings
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Manage your account
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/settings" && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
