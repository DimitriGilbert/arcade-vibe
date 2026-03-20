"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Cpu, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Board", href: "/leaderboard", icon: Trophy },
  { label: "Models", href: "/models", icon: Cpu },
  { label: "Creator", href: "/creator", icon: Wand2 },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-stretch">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors",
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted-foreground)]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
