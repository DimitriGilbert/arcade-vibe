"use client";

import type { Route } from "next";
import Link from "next/link";

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
}> = [
  {
    value: "classic",
    label: "Classic",
    href: (username) => `/profile/${username}` as Route,
  },
  {
    value: "dashboard",
    label: "Dashboard",
    href: (username) => `/profile/dashboard/${username}` as Route,
  },
  {
    value: "magazine",
    label: "Magazine",
    href: (username) => `/profile/magazine/${username}` as Route,
  },
  {
    value: "arcade",
    label: "Arcade",
    href: (username) => `/profile/arcade/${username}` as Route,
  },
];

export function ProfileViewSwitcher({
  username,
  currentView,
  className,
}: ProfileViewSwitcherProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {PROFILE_VIEW_OPTIONS.map((option) => {
        const isActive = option.value === currentView;

        return (
          <Link
            key={option.value}
            href={option.href(username)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
