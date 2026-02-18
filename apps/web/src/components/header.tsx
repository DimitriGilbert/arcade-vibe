"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

// Main app navigation
const MAIN_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/arcade" },
  { label: "Models", href: "/models" },
  { label: "Editor", href: "/editor" },
] as const;

export default function Header() {
  const pathname = usePathname();

  // Determine active tab for main navigation
  const getActiveTab = () => {
    if (pathname === "/") return "/";
    const firstSegment = `/${pathname.split("/")[1]}`;
    return MAIN_NAV_ITEMS.some((item) => item.href === firstSegment)
      ? firstSegment
      : "/";
  };

  return (
    <div className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="flex flex-row items-center justify-center px-4 py-2">
        <nav className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/40 px-2 py-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = getActiveTab() === item.href;
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center rounded-[calc(var(--radius)-4px)] px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mx-1 h-6 w-px bg-[var(--border)]" />
          <ModeToggle />
          <UserMenu />
        </nav>
      </div>
    </div>
  );
}
