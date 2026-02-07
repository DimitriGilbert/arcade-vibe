"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, ArrowUpDown, History, Filter, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SortField = "createdAt" | "actionType" | "targetType" | "adminName";
type SortOrder = "asc" | "desc";

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch admin actions (using mock data since endpoint doesn't exist yet)
  const { data: actions, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      // Mock data for now - in production this would call actual endpoint
      return [
        {
          id: "1",
          adminId: "admin-1",
          adminName: "Alice Admin",
          actionType: "create_theme",
          targetType: "theme",
          targetId: "theme-1",
          reason: "Created new theme: Space Adventure",
          metadata: null,
          createdAt: "2025-02-01T10:00:00Z",
        },
        {
          id: "2",
          adminId: "admin-2",
          adminName: "Bob Admin",
          actionType: "suspend_user",
          targetType: "user",
          targetId: "user-1",
          reason: "Violation of community guidelines",
          metadata: '{"duration": "30d"}',
          createdAt: "2025-02-02T14:30:00Z",
        },
        {
          id: "3",
          adminId: "admin-1",
          adminName: "Alice Admin",
          actionType: "resolve_report",
          targetType: "game",
          targetId: "game-1",
          reason: "Removed inappropriate content",
          metadata: '{"resolutionAction": "approved"}',
          createdAt: "2025-02-03T09:15:00Z",
        },
        {
          id: "4",
          adminId: "admin-1",
          adminName: "Alice Admin",
          actionType: "update_plan",
          targetType: "plan",
          targetId: "plan-1",
          reason: "Updated pricing",
          metadata: '{"oldPrice": 999, "newPrice": 1499}',
          createdAt: "2025-02-04T16:45:00Z",
        },
        {
          id: "5",
          adminId: "admin-2",
          adminName: "Bob Admin",
          actionType: "activate_model",
          targetType: "model",
          targetId: "model-1",
          reason: "Enabled new AI model",
          metadata: null,
          createdAt: "2025-02-05T11:20:00Z",
        },
      ] as AuditAction[];
    },
  });

  // Filter and sort actions
  const filteredActions = (actions || []).filter((action) => {
    const matchesSearch = !searchQuery.trim() ||
      action.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.targetType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAdmin = adminFilter === "all" || action.adminName === adminFilter;
    const matchesAction = actionFilter === "all" || action.actionType === actionFilter;
    const matchesType = typeFilter === "all" || action.targetType === typeFilter;

    return matchesSearch && matchesAdmin && matchesAction && matchesType;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "actionType":
        comparison = a.actionType.localeCompare(b.actionType);
        break;
      case "targetType":
        comparison = a.targetType.localeCompare(b.targetType);
        break;
      case "adminName":
        comparison = a.adminName.localeCompare(b.adminName);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading audit log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Audit Log
        </h1>
        <p className="text-muted-foreground mt-2">
          View all admin actions on the platform
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Admins</option>
              <option value="Alice Admin">Alice Admin</option>
              <option value="Bob Admin">Bob Admin</option>
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Actions</option>
              <option value="create_theme">Create Theme</option>
              <option value="suspend_user">Suspend User</option>
              <option value="resolve_report">Resolve Report</option>
              <option value="update_plan">Update Plan</option>
              <option value="activate_model">Activate Model</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              <option value="theme">Theme</option>
              <option value="user">User</option>
              <option value="game">Game</option>
              <option value="plan">Plan</option>
              <option value="model">Model</option>
              <option value="report">Report</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {[
                    { field: "createdAt" as SortField, label: "Date" },
                    { field: "adminName" as SortField, label: "Admin" },
                    { field: "actionType" as SortField, label: "Action" },
                    { field: "targetType" as SortField, label: "Type" },
                  ].map((column) => (
                    <th
                      key={column.field}
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort(column.field)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No audit entries found
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((action) => (
                    <tr
                      key={action.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(action.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{action.adminName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {action.actionType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {action.targetType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {action.reason || "No reason provided"}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type AuditAction = {
  id: string;
  adminId: string;
  adminName: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  metadata: string | null;
  createdAt: string;
};
