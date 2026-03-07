"use client";

import type { Route } from "next";
import Link from "next/link";
import { LayoutList, LayoutDashboard, Newspaper, Gamepad2 } from "lucide-react";

import type { ProfileImplementation } from "@/lib/trpc-types";
import { cn } from "@/lib/utils";

interface ProfileViewSwitcherProps {
  username: string;
  currentView: ProfileImplementation;
  className?: string;
}

const PROFILE_VIEW_OPTIONS: ReadonlyArray<{
  href: (username: string) => Route;
  label: string;
  value: ProfileImplementation;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "classic",
    label: "Classic",
    icon: LayoutList,
    href: (username) => `/profile/${username}` as Route,
  },
  {
    value: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: (username) => `/profile/dashboard/${username}` as Route,
  },
  {
    value: "magazine",
    label: "Magazine",
    icon: Newspaper,
    href: (username) => `/profile/magazine/${username}` as Route,
  },
  {
    value: "arcade",
    label: "Arcade",
    icon: Gamepad2,
    href: (username) => `/profile/arcade/${username}` as Route,
  },
];

export function ProfileViewSwitcher({
  username,
  currentView,
  className,
}: ProfileViewSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-1 shadow-md",
        className,
      )}
    >
      {PROFILE_VIEW_OPTIONS.map((option) => {
        const isActive = option.value === currentView;
        const Icon = option.icon;

        return (
          <Link
            key={option.value}
            href={option.href(username)}
            title={option.label}
            className={cn(
              "relative inline-flex items-center justify-center rounded-md p-2 transition-all duration-200",
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            <Icon className="w-4 h-4" />
          </Link>
        );
      })}
    </div>
  );
}
