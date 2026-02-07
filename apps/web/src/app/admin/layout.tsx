"use client";

import type { Route } from "next";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, Settings, Users, FileText, Shield, Archive, History, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Plans", href: "/admin/plans", icon: FileText },
  { name: "Models", href: "/admin/models", icon: Settings },
  { name: "Moderation", href: "/admin/moderation", icon: Shield },
  { name: "Themes", href: "/admin/themes", icon: Archive },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Audit Log", href: "/admin/audit", icon: History },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const userRole = user ? (user as { role?: string }).role : undefined;

  if (!isPending && (!user || userRole !== "admin")) {
    toast.error("Access denied", {
      description: "You need admin privileges to access this page",
    });
    router.push("/");
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Admin
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Dashboard
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.[0] || "A"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Exit Admin"
            >
                <LogOut className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {isSidebarOpen ? <LogOut className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
