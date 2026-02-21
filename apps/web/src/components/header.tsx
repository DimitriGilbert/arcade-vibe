"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { ModeToggle } from "./mode-toggle";
import { MusicPlayer } from "./music-player";
import UserMenu from "./user-menu";

// Navigation item types
interface NavItem {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
}

// Main app navigation with dropdown support
const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    children: [
      { label: "Arena", href: "/leaderboard/arena" },
      { label: "Dashboard", href: "/leaderboard/dashboard" },
      { label: "Magazine", href: "/leaderboard/magazine" },
    ],
  },
  { label: "Models", href: "/models" },
  {
    label: "Creator",
    href: "/creator",
    children: [
      { label: "Workbench", href: "/creator/workbench" },
      { label: "Inbox", href: "/creator/inbox" },
      { label: "File Browser", href: "/creator/filebrowser" },
    ],
  },
];

interface NavDropdownProps {
  item: NavItem;
  isActive: boolean;
}

function NavDropdown({ item, isActive }: NavDropdownProps) {
  const pathname = usePathname();

  // Check if any child route is active
  const isChildActive = item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"));

  return (
    <div className="relative group">
      <Link
        href={item.href as Route}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1 rounded-[calc(var(--radius)-4px)] px-4 py-1.5 text-sm font-medium transition-all duration-200",
          isActive || isChildActive
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        )}
      >
        {item.label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
      </Link>

      {/* Dropdown menu - visible on hover */}
      <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="min-w-[140px] rounded-md border border-[var(--border)] bg-[var(--popover)] p-1 shadow-md">
          {item.children?.map((child) => {
            const childIsActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href as Route}
                className={cn(
                  "flex items-center rounded-sm px-3 py-2 text-sm transition-colors",
                  childIsActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();

  // Determine active tab for main navigation
  const getActiveTab = () => {
    if (pathname === "/") return "/";
    const firstSegment = `/${pathname.split("/")[1]}`;
    return MAIN_NAV_ITEMS.some((item) => item.href === firstSegment) ? firstSegment : "/";
  };

  return (
    <div className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="flex flex-row items-center justify-center px-4 py-2">
        <nav className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/40 px-2 py-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = getActiveTab() === item.href;

            // If item has children, render as dropdown
            if (item.children) {
              return <NavDropdown key={item.href} item={item} isActive={isActive} />;
            }

            // Regular nav item without dropdown
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
          <MusicPlayer />
          <UserMenu />
        </nav>
      </div>
    </div>
  );
}
