"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Shield, Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";

export default function AdminDashboardPage() {
  // Fetch pending moderation reports
  const { data: pendingReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-pending-reports"],
    queryFn: async () => {
      try {
        const reports = await trpcClient.moderation.getQueue.query({ limit: 5 });
        return reports;
      } catch {
        return [];
      }
    },
  });

  // Use memoized stats (mock data for now)
  const stats = useMemo(() => ({
    totalUsers: 1250,
    activeUsers: 342,
    totalPrompts: 856,
    totalGames: 1243,
    pendingReports: pendingReports?.length || 12,
  }), [pendingReports]);

  // Recent admin actions - using mock data for now
  const adminActions: Array<{
    id: string;
    actionType: string;
    targetType: string;
    reason: string | null;
    createdAt: string;
    adminId: string;
  }> = [];

  const isLoading = reportsLoading;

  const statistics = useMemo(() => {
    const items = [
      {
        title: "Total Users",
        value: stats.totalUsers,
        icon: Users,
        tone: "secondary",
        change: "+12%",
        positive: true,
      },
      {
        title: "Active Users",
        value: stats.activeUsers,
        icon: Activity,
        tone: "accent",
        change: "+8%",
        positive: true,
      },
      {
        title: "Total Prompts",
        value: stats.totalPrompts,
        icon: FileText,
        tone: "primary",
        change: "+24%",
        positive: true,
      },
      {
        title: "Pending Reports",
        value: stats.pendingReports,
        icon: AlertTriangle,
        tone: "destructive",
        change: "-5%",
        positive: true,
      },
    ] as const;

    return items;
  }, [stats]);

  const toneClasses = {
    primary: "bg-[var(--primary)]/15 text-[var(--primary)]",
    secondary: "bg-[var(--secondary)]/15 text-[var(--secondary)]",
    accent: "bg-[var(--accent)]/15 text-[var(--accent)]",
    destructive: "bg-[var(--destructive)]/15 text-[var(--destructive)]",
  } as const;

  const quickActions = [
    { name: "Manage Plans", href: "/admin/plans", description: "Configure subscription plans and pricing" },
    { name: "Manage Models", href: "/admin/models", description: "Add, edit, and configure AI models" },
    { name: "Moderation Queue", href: "/admin/moderation", description: "Review and resolve user reports" },
    { name: "Manage Themes", href: "/admin/themes", description: "Create and manage competition themes" },
    { name: "User Management", href: "/admin/users", description: "View and manage user accounts" },
    { name: "Audit Log", href: "/admin/audit", description: "View admin activity history" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening on the platform.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statistics.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${toneClasses[stat.tone]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {stat.change && (
                    <Badge
                      variant={stat.positive ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
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
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Moderation */}
        <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
              Pending Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {report.reason}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
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
          </CardContent>
        </Card>

        {/* Recent Admin Activity */}
        <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--primary)]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {action.targetType}: {action.reason || "No reason provided"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
