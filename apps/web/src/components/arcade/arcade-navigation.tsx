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

interface NavItem {
  label: string;
  href: Route;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Arcade", href: "/arcade" },
  { label: "Editor", href: "/editor" },
  { label: "AI Chat", href: "/ai" },
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
    <ArcadeTabs
      value={getActiveTab()}
      className={cn("w-auto", className)}
      orientation="horizontal"
    >
      <ArcadeTabsList variant="line" className="gap-1 bg-transparent border-0">
        {NAV_ITEMS.map((item) => {
          const isActive = getActiveTab() === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <ArcadeTabsTrigger
                value={item.href}
                variant="line"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200",
                  "border-b-2",
                  isActive
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--muted)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
                )}
              >
                {item.label}
              </ArcadeTabsTrigger>
            </Link>
          );
        })}
      </ArcadeTabsList>
    </ArcadeTabs>
  );
}

export { NAV_ITEMS };
