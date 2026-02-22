"use client";

import type { Route } from "next";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Shield,
  Archive,
  History,
  LogOut,
  Layers,
  DollarSign,
  Menu,
  X,
  Gamepad2,
  MessageSquare,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Plans", href: "/admin/plans", icon: FileText },
  { name: "Models", href: "/admin/models", icon: Settings },
  { name: "Tier Costs", href: "/admin/tier-costs", icon: DollarSign },
  { name: "Library Patterns", href: "/admin/library-patterns", icon: Layers },
  { name: "Moderation", href: "/admin/moderation", icon: Shield },
  { name: "Themes", href: "/admin/themes", icon: Archive },
  { name: "Games", href: "/admin/games", icon: Gamepad2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Email", href: "/admin/email", icon: Mail },
  { name: "Audit Log", href: "/admin/audit", icon: History },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const user = session?.user;

  // Fetch user's role from userExtended table via tRPC
  const { data: userExtended, isPending: rolePending } = useQuery({
    queryKey: ["user", "extended"],
    queryFn: () => trpcClient.credits.getUserExtended.query(),
    enabled: !!user,
  });

  const userRole = userExtended?.role;
  const isPending = sessionPending || rolePending;

  if (!isPending && (!user || userRole !== "admin")) {
    toast.error("Access denied", {
      description: "You need admin privileges to access this page",
    });
    router.push("/");
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[var(--primary)]" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background/80 backdrop-blur-sm border-r border-[var(--border)] transition-all duration-300",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] rounded-lg">
                <Shield className="h-5 w-5 text-[var(--primary-foreground)]" />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-[var(--foreground)]">
                    Admin
                  </h1>
                  <p className="text-xs text-muted-foreground">Dashboard</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--primary)]/40"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-sm font-medium">
                {user?.name?.[0] || "A"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                aria-label="Exit admin dashboard"
                title="Exit Admin"
              >
                <LogOut className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20",
        )}
      >
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] rounded-lg">
                <Shield className="h-5 w-5 text-[var(--primary-foreground)]" />
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">
                Admin
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
              className="p-2 hover:bg-[var(--muted)] rounded-lg"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
