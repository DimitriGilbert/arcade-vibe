"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, FileText, Shield, Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const statistics = useMemo(() => [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      change: "+12%",
      positive: true,
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "from-green-500 to-emerald-500",
      change: "+8%",
      positive: true,
    },
    {
      title: "Total Prompts",
      value: stats.totalPrompts,
      icon: FileText,
      color: "from-purple-500 to-pink-500",
      change: "+24%",
      positive: true,
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: "from-orange-500 to-red-500",
      change: "-5%",
      positive: true,
    },
  ], [stats]);

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
            <Card key={stat.title} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {stat.change && (
                    <Badge
                      variant={stat.positive ? "default" : "destructive"}
                      className={`text-xs ${stat.positive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}`}
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
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all"
              >
                <h3 className="font-semibold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingReports || pendingReports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">No pending reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
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
                    className="block text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-2"
                  >
                    View all {pendingReports.length} reports →
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Admin Activity */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!adminActions || adminActions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminActions.slice(0, 5).map((action) => (
                  <div
                    key={action.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
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
