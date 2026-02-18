"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/arcade" },
  { label: "Models", href: "/models" },
  { label: "Editor", href: "/editor" },
];

interface ArcadeNavigationProps {
  className?: string;
}

export function ArcadeNavigation({ className }: ArcadeNavigationProps) {
  const pathname = usePathname();

  // Determine active tab - handle nested routes
  const getActiveTab = () => {
    if (pathname === "/") return "/";
    const firstSegment = `/${pathname.split("/")[1]}`;
    return NAV_ITEMS.some((item) => item.href === firstSegment)
      ? firstSegment
      : "/";
  };

  return (
    <nav
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/40 px-2 py-1",
        className,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = getActiveTab() === item.href;
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-[calc(var(--radius)-4px)] px-4 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { NAV_ITEMS };
