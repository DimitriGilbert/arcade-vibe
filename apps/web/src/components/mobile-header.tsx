"use client";

import type { Route } from "next";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ChevronRight,
  Settings,
  User,
  LogOut,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ModeToggle } from "./mode-toggle";
import { MusicPlayer } from "./music-player";
import { authClient } from "@/lib/auth-client";

// Same nav items as desktop header for consistency
interface NavItem {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
}

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
  { label: "Creator", href: "/creator/ide" },
];

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)] lg:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/arcade-vibe_logo-trans.webp"
            alt="Arcade Vibe"
            width={100}
            height={58}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-1">
          <MusicPlayer />
          <ModeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" showCloseButton>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <nav className="flex-1 overflow-y-auto px-4 py-2">
                <div className="space-y-1">
                  {MAIN_NAV_ITEMS.map((item) => (
                    <div key={item.href}>
                      <SheetClose
                        render={
                          <Link
                            href={item.href as Route}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors",
                              isActive(item.href)
                                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                            )}
                          />
                        }
                      >
                        {item.label}
                        {item.children && (
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        )}
                      </SheetClose>

                      {item.children && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                          {item.children.map((child) => (
                            <SheetClose
                              key={child.href}
                              render={
                                <Link
                                  href={child.href as Route}
                                  className={cn(
                                    "block px-3 py-2 rounded-[var(--radius)] text-sm transition-colors",
                                    isActive(child.href)
                                      ? "text-[var(--primary)] bg-[var(--primary)]/10"
                                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                                  )}
                                />
                              }
                            >
                              {child.label}
                            </SheetClose>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-[var(--border)]" />

                {/* User section */}
                {session?.user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xs font-medium">
                        {session.user.name?.[0] ?? "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.user.name ?? "User"}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>

                    <SheetClose
                      render={
                        <Link
                          href={`/profile/${session.user.name}` as Route}
                          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                        />
                      }
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </SheetClose>

                    <SheetClose
                      render={
                        <Link
                          href={"/settings" as Route}
                          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                        />
                      }
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </SheetClose>

                    <SheetClose
                      render={
                        <Link
                          href={"/collections" as Route}
                          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                        />
                      }
                    >
                      <FolderOpen className="h-4 w-4" />
                      My Collections
                    </SheetClose>

                    <button
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius)] text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
                      onClick={() => {
                        setOpen(false);
                        authClient.signOut({
                          fetchOptions: {
                            onSuccess: () => {
                              router.push("/");
                            },
                          },
                        });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <SheetClose
                    render={
                      <Link
                        href={"/login" as Route}
                        className="flex items-center justify-center w-full px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                      />
                    }
                  >
                    Sign In
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
