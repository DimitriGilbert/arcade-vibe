"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FileText,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";
import type { AdminStats } from "@/lib/trpc-types";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const result = await trpcClient.admin.stats.getStats.query();
      return result as AdminStats;
    },
  });

  const { data: pendingReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-pending-reports"],
    queryFn: async () => {
      try {
        const reports = await trpcClient.moderation.getQueue.query({
          limit: 5,
        });
        return reports;
      } catch {
        return [];
      }
    },
  });

  const { data: adminActionsData, isLoading: actionsLoading } = useQuery({
    queryKey: ["admin-recent-actions"],
    queryFn: async () => {
      const result = await trpcClient.admin.stats.getActions.query({
        limit: 5,
      });
      return result;
    },
  });

  const adminActions = adminActionsData?.actions ?? [];
  const isLoading = statsLoading || reportsLoading || actionsLoading;

  const statistics = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      tone: "secondary" as const,
    },
    {
      title: "Active Users",
      value: stats?.activeUsers ?? 0,
      icon: Activity,
      tone: "accent" as const,
    },
    {
      title: "Total Prompts",
      value: stats?.totalPrompts ?? 0,
      icon: FileText,
      tone: "primary" as const,
    },
    {
      title: "Total Games",
      value: stats?.totalGames ?? 0,
      icon: Shield,
      tone: "secondary" as const,
    },
  ];

  const toneClasses = {
    primary: "bg-[var(--primary)]/15 text-[var(--primary)]",
    secondary: "bg-[var(--secondary)]/15 text-[var(--secondary)]",
    accent: "bg-[var(--accent)]/15 text-[var(--accent)]",
    destructive: "bg-[var(--destructive)]/15 text-[var(--destructive)]",
  } as const;

  const quickActions = [
    {
      name: "Manage Plans",
      href: "/admin/plans",
      description: "Configure subscription plans and pricing",
    },
    {
      name: "Manage Models",
      href: "/admin/models",
      description: "Add, edit, and configure AI models",
    },
    {
      name: "Moderation Queue",
      href: "/admin/moderation",
      description: "Review and resolve user reports",
    },
    {
      name: "Manage Themes",
      href: "/admin/themes",
      description: "Create and manage competition themes",
    },
    {
      name: "User Management",
      href: "/admin/users",
      description: "View and manage user accounts",
    },
    {
      name: "Audit Log",
      href: "/admin/audit",
      description: "View admin activity history",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Dashboard Overview
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Welcome back! Here's what's happening on the platform.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingState
            size="lg"
            message="Loading dashboard..."
            variant="accent"
            centered
          />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statistics.map((stat) => {
              const Icon = stat.icon;
              return (
                <ArcadeCard key={stat.title}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[var(--muted-foreground)]">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold">
                          {stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${toneClasses[stat.tone]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Last updated:{" "}
                        {stats?.lastCalculatedAt
                          ? new Date(stats.lastCalculatedAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </ArcadeCard>
              );
            })}
          </div>

          {/* Quick Actions */}
          <ArcadeCard>
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)] text-xl">
                Quick Actions
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className="group p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/40 transition-all"
                  >
                    <h3 className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {action.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </ArcadeCard>

          {/* Two Column Layout for Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Moderation */}
            <ArcadeCard>
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)] text-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
                  Pending Moderation
                </h3>
              </div>
              <div className="p-4">
                {!pendingReports || pendingReports.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle className="h-12 w-12" />}
                    message="No pending reports"
                  />
                ) : (
                  <div className="space-y-3">
                    {pendingReports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="p-3 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {report.targetType} Report
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate mt-1">
                              {report.reason}
                            </p>
                          </div>
                          <ArcadeBadge text={report.status} variant="default" />
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-2">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {pendingReports.length > 5 && (
                      <a
                        href="/admin/moderation"
                        className="block text-center text-sm text-[var(--primary)] hover:brightness-110 mt-2"
                      >
                        View all {pendingReports.length} reports →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </ArcadeCard>

            {/* Recent Admin Activity */}
            <ArcadeCard>
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)] text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--primary)]" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-4">
                {!adminActions || adminActions.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="h-12 w-12" />}
                    message="No recent activity"
                  />
                ) : (
                  <div className="space-y-3">
                    {adminActions.slice(0, 5).map((action) => (
                      <div
                        key={action.id}
                        className="p-3 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {action.actionType.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate mt-1">
                              {action.targetType}:{" "}
                              {action.reason || "No reason provided"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-2">
                          {new Date(action.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ArcadeCard>
          </div>
        </>
      )}
    </div>
  );
}
