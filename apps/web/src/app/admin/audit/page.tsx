"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpDown, Calendar, User } from "lucide-react";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeInput,
  ArcadeBadge,
} from "@/components/arcade";
import { LoadingState } from "@/components/reusable";
import { EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";
import type { AdminAction } from "@/lib/trpc-types";

type SortField = "createdAt" | "actionType" | "targetType" | "adminName";
type SortOrder = "asc" | "desc";

const ACTION_TYPES = [
  "hide_game",
  "suspend_user",
  "update_scoring_weights",
  "activate_model",
  "deactivate_model",
  "update_model_pricing",
  "add_model",
  "delete_model",
  "add_plan",
  "update_plan",
  "activate_plan",
  "deactivate_plan",
  "create_tier_cost",
  "update_tier_cost",
  "delete_tier_cost",
  "create_library_pattern",
  "update_library_pattern",
  "delete_library_pattern",
  "resolve_report",
  "resolve_appeal",
];

const TARGET_TYPES = ["theme", "user", "game", "plan", "model", "report"];

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: actionsData, isLoading } = useQuery({
    queryKey: ["admin-audit", page, actionFilter, typeFilter],
    queryFn: async () => {
      const result = await trpcClient.admin.stats.getActions.query({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        actionType: actionFilter === "all" ? undefined : actionFilter,
        targetType: typeFilter === "all" ? undefined : typeFilter,
      });
      return result;
    },
  });

  const actions = actionsData?.actions ?? [];
  const total = actionsData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredActions = actions.filter((action: AdminAction) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      action.actionType.toLowerCase().includes(query) ||
      action.targetType.toLowerCase().includes(query) ||
      (action.reason?.toLowerCase().includes(query) ?? false) ||
      action.adminName.toLowerCase().includes(query)
    );
  });

  const sortedActions = [...filteredActions].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
        <LoadingState
          size="lg"
          message="Loading audit log..."
          variant="accent"
          centered
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Audit Log
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          View all admin actions on the platform
        </p>
      </div>

      <ArcadeCard>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <ArcadeInput
                placeholder="Search audit log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-[var(--background)]"
            >
              <option value="all">All Actions</option>
              {ACTION_TYPES.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-[var(--background)]"
            >
              <option value="all">All Types</option>
              {TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ArcadeCard>

      <ArcadeCard>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[
                    { field: "createdAt" as SortField, label: "Date" },
                    { field: "adminName" as SortField, label: "Admin" },
                    { field: "actionType" as SortField, label: "Action" },
                    { field: "targetType" as SortField, label: "Type" },
                  ].map((column) => (
                    <th
                      key={column.field}
                      className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors"
                      onClick={() => handleSort(column.field)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedActions.length === 0 ? (
                  <tr>
                    <EmptyState
                      message="No audit entries found"
                      variant="table"
                      colSpan={5}
                    />
                  </tr>
                ) : (
                  sortedActions.map((action: AdminAction) => (
                    <tr
                      key={action.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(action.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[var(--primary)]" />
                          <span className="font-medium">
                            {action.adminName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ArcadeBadge
                          text={action.actionType.replace(/_/g, " ")}
                          variant="default"
                          className="capitalize"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ArcadeBadge
                          text={action.targetType}
                          variant="neon"
                          className="capitalize"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                          {action.reason || "No reason provided"}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
            <ArcadeButton
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </ArcadeButton>
            <span className="text-sm text-[var(--muted-foreground)]">
              Page {page} of {totalPages} ({total} entries)
            </span>
            <ArcadeButton
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              Next
            </ArcadeButton>
          </div>
        </div>
      </ArcadeCard>
    </div>
  );
}