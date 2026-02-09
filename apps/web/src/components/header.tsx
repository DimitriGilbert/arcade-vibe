"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArcadeTabs,
  ArcadeTabsList,
  ArcadeTabsTrigger,
} from "@/components/arcade";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

// Main app navigation
const MAIN_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Arcade", href: "/arcade" },
  { label: "Editor", href: "/editor" },
  { label: "AI Chat", href: "/ai" },
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
    <div className="bg-[var(--background)] border-b border-[var(--border)]">
      <div className="flex flex-row items-center justify-center px-4 py-2">
        {/* Centered Menu Bar - Everything INSIDE */}
        <ArcadeTabs
          value={getActiveTab()}
          className="w-auto"
          orientation="horizontal"
        >
          <ArcadeTabsList
            variant="default"
            className="gap-1 bg-[var(--muted)]/40 px-2"
          >
            {/* Navigation Links */}
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = getActiveTab() === item.href;
              return (
                <Link key={item.href} href={item.href as Route}>
                  <ArcadeTabsTrigger
                    value={item.href}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {item.label}
                  </ArcadeTabsTrigger>
                </Link>
              );
            })}

            {/* Separator */}
            <div className="w-px h-6 bg-[var(--border)] mx-1" />

            {/* Theme Toggle - INSIDE menu bar */}
            <ModeToggle />

            {/* User Menu - INSIDE menu bar */}
            <UserMenu />
          </ArcadeTabsList>
        </ArcadeTabs>
      </div>
    </div>
  );
}
