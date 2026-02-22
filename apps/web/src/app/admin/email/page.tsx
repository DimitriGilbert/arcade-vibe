"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowUpDown,
  Mail,
  Send,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  X,
} from "lucide-react";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeInput,
  ArcadeBadge,
} from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LoadingState, EmptyState } from "@/components/reusable";
import UserAvatar from "@/components/reusable/user-avatar";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import type {
  UserForEmail,
  EmailLog,
  EmailStats,
  UserFilterInput,
  SortField,
  SortOrder,
} from "@/lib/trpc-types";

// ============================================
// Component
// ============================================

export default function AdminEmailPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "logs" | "stats">("compose");
  const [filters, setFilters] = useState<UserFilterInput>({});
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [composeDialog, setComposeDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [logStatusFilter, setLogStatusFilter] = useState<
    "pending" | "sent" | "delivered" | "bounced" | "complained" | "failed" | undefined
  >(undefined);
  const pageSize = 50;
  const queryClient = useQueryClient();

  // Fetch filtered users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-email-users", filters, sortField, sortOrder, page],
    queryFn: async () => {
      return await trpcClient.admin.email.getFilteredUsers.query({
        filters,
        sort: { field: sortField, order: sortOrder },
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
    },
    enabled: activeTab === "compose",
  });

  // Fetch email logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-email-logs", logPage, logStatusFilter],
    queryFn: async () => {
      return await trpcClient.admin.email.getLogs.query({
        limit: pageSize,
        offset: (logPage - 1) * pageSize,
        status: logStatusFilter,
      });
    },
    enabled: activeTab === "logs",
  });

  // Fetch email stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-email-stats"],
    queryFn: async () => {
      return await trpcClient.admin.email.getStats.query({});
    },
    enabled: activeTab === "stats",
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (input: { userIds: string[]; subject: string; content: string }) => {
      return await trpcClient.admin.email.sendToUsers.mutate(input);
    },
    onSuccess: (data) => {
      toast.success(`Email sent to ${data.sentCount} users`);
      if (data.failedCount > 0) {
        toast.warning(`${data.failedCount} emails failed to send`);
      }
      setComposeDialog(false);
      setSelectedUsers(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-email-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-email-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send email");
    },
  });

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllVisible = () => {
    if (usersData?.users) {
      const newSelection = new Set(selectedUsers);
      usersData.users.forEach((u: UserForEmail) => newSelection.add(u.id));
      setSelectedUsers(newSelection);
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const clearFilters = () => {
    setFilters({});
  };

  // ============================================
  // Compose Form Component
  // ============================================

  const ComposeForm = () => {
    const schema = z.object({
      subject: z.string().min(1, "Subject is required").max(200),
      content: z.string().min(1, "Content is required"),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Enter email subject...",
        },
        {
          name: "content",
          type: "textarea",
          label: "Content (HTML supported)",
          textareaConfig: { rows: 10 },
          placeholder: "Enter email content...",
        },
      ],
      formOptions: {
        defaultValues: {
          subject: "",
          content: "",
        },
        onSubmit: async ({ value }) => {
          await sendEmailMutation.mutateAsync({
            userIds: Array.from(selectedUsers),
            subject: value.subject,
            content: value.content,
          });
        },
      },
    });

    return <Form className="space-y-4" />;
  };

  // ============================================
  // Filter Panel Component
  // ============================================

  const FilterPanel = () => (
    <ArcadeCard className="mb-4">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[var(--foreground)]">Filters</h3>
          <ArcadeButton variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Clear All
          </ArcadeButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 lg:col-span-4">
            <span className="text-sm text-[var(--muted-foreground)] block">Search</span>
            <ArcadeInput
              placeholder="Search by name or email..."
              value={filters.searchQuery ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  searchQuery: e.target.value || undefined,
                })
              }
              className="mt-1"
            />
          </div>

          {/* Role Filter */}
          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Role</span>
            <select
              className="w-full mt-1 p-2 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
              value={filters.role ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  role: (e.target.value as UserFilterInput["role"]) || undefined,
                })
              }
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="participant">Participant</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Game Count Filters */}
          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Min Games</span>
            <ArcadeInput
              type="number"
              min={0}
              value={filters.minGames ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minGames: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Max Games</span>
            <ArcadeInput
              type="number"
              min={0}
              value={filters.maxGames ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxGames: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          {/* Credit Filters */}
          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Min Credits</span>
            <ArcadeInput
              type="number"
              min={0}
              value={filters.minCredits ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minCredits: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Max Credits</span>
            <ArcadeInput
              type="number"
              min={0}
              value={filters.maxCredits ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxCredits: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          {/* Credit Spent Filters */}
          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Min Credits Spent</span>
            <ArcadeInput
              type="number"
              min={0}
              value={filters.minCreditSpent ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minCreditSpent: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          {/* Reputation Filters */}
          <div>
            <span className="text-sm text-[var(--muted-foreground)] block">Min Reputation</span>
            <ArcadeInput
              type="number"
              min={0}
              value={filters.minReputation ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minReputation: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-6 lg:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isSuspended ?? false}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    isSuspended: e.target.checked ? true : undefined,
                  })
                }
                className="rounded border-[var(--border)]"
              />
              <span className="text-sm">Suspended Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasVerifiedEmail ?? false}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    hasVerifiedEmail: e.target.checked ? true : undefined,
                  })
                }
                className="rounded border-[var(--border)]"
              />
              <span className="text-sm">Verified Email Only</span>
            </label>
          </div>
        </div>
      </div>
    </ArcadeCard>
  );

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Email Management</h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Send emails to users and track delivery status
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "compose" as const, label: "Compose", icon: Send },
          { id: "logs" as const, label: "Logs", icon: Mail },
          { id: "stats" as const, label: "Statistics", icon: BarChart3 },
        ].map((tab) => (
          <ArcadeButton
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "outline"}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </ArcadeButton>
        ))}
      </div>

      {/* Compose Tab */}
      {activeTab === "compose" && (
        <>
          {/* Selection Actions */}
          {selectedUsers.size > 0 && (
            <ArcadeCard>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-[var(--foreground)]">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex gap-2">
                  <ArcadeButton variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </ArcadeButton>
                  <ArcadeButton variant="primary" size="sm" onClick={() => setComposeDialog(true)}>
                    <Send className="h-4 w-4" />
                    Send Email
                  </ArcadeButton>
                </div>
              </div>
            </ArcadeCard>
          )}

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <ArcadeButton variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </ArcadeButton>
            <ArcadeButton variant="outline" onClick={selectAllVisible}>
              Select All Visible
            </ArcadeButton>
          </div>

          {/* Filters */}
          {showFilters && <FilterPanel />}

          {/* Users Table */}
          <ArcadeCard>
            <div className="p-6">
              {usersLoading ? (
                <LoadingState message="Loading users..." centered />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              usersData?.users.length
                                ? usersData.users.every((u: UserForEmail) => selectedUsers.has(u.id))
                                : false
                            }
                            onChange={(e) =>
                              e.target.checked ? selectAllVisible() : clearSelection()
                            }
                            className="rounded border-[var(--border)]"
                          />
                        </th>
                        {[
                          { field: "name" as const, label: "Name" },
                          { field: "credits" as const, label: "Credits" },
                          { field: "creditSpent" as const, label: "Spent" },
                          { field: "gameCount" as const, label: "Games" },
                          { field: "promptCount" as const, label: "Prompts" },
                          { field: "reputation" as const, label: "Reputation" },
                        ].map((col) => (
                          <th
                            key={col.field}
                            className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors"
                            onClick={() => handleSort(col.field)}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!usersData?.users.length ? (
                        <tr>
                          <td colSpan={8}>
                            <EmptyState variant="table" message="No users found" />
                          </td>
                        </tr>
                      ) : (
                        usersData.users.map((user: UserForEmail) => (
                          <tr
                            key={user.id}
                            className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors ${
                              selectedUsers.has(user.id) ? "bg-[var(--primary)]/10" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="rounded border-[var(--border)]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <UserAvatar user={user} size="xs" />
                                <div>
                                  <div className="font-medium">{user.name ?? "Unknown"}</div>
                                  <div className="text-xs text-[var(--muted-foreground)]">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{user.credits.toLocaleString()}</td>
                            <td className="px-4 py-3">{user.creditSpent.toLocaleString()}</td>
                            <td className="px-4 py-3">{user.gameCount}</td>
                            <td className="px-4 py-3">{user.promptCount}</td>
                            <td className="px-4 py-3">{user.reputation}</td>
                            <td className="px-4 py-3">
                              {user.isSuspended ? (
                                <ArcadeBadge text="Suspended" variant="pixel" />
                              ) : (
                                <ArcadeBadge text="Active" variant="neon" />
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
                <ArcadeButton
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </ArcadeButton>
                <span className="text-sm text-[var(--muted-foreground)]">
                  Page {page} • {usersData?.total ?? 0} users
                </span>
                <ArcadeButton
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!usersData || usersData.users.length < pageSize}
                >
                  Next
                </ArcadeButton>
              </div>
            </div>
          </ArcadeCard>
        </>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <ArcadeCard>
          <div className="p-6">
            {/* Status Filter */}
            <div className="mb-4">
              <span className="text-sm text-[var(--muted-foreground)] mr-2">
                Filter by Status:
              </span>
              <select
                className="p-2 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                value={logStatusFilter ?? ""}
                onChange={(e) =>
                  setLogStatusFilter(
                    (e.target.value as typeof logStatusFilter) || undefined,
                  )
                }
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="bounced">Bounced</option>
                <option value="complained">Complained</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {logsLoading ? (
              <LoadingState message="Loading logs..." centered />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                        Recipient
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!logsData?.logs.length ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState variant="table" message="No email logs found" />
                        </td>
                      </tr>
                    ) : (
                      logsData.logs.map((log: EmailLog) => (
                        <tr
                          key={log.id}
                          className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{log.userName ?? "Unknown"}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {log.userEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate">{log.subject}</td>
                          <td className="px-4 py-3">
                            <ArcadeBadge text={log.emailType} variant="default" />
                          </td>
                          <td className="px-4 py-3">
                            <ArcadeBadge
                              text={log.status}
                              variant={
                                log.status === "delivered"
                                  ? "neon"
                                  : log.status === "failed" || log.status === "bounced"
                                    ? "pixel"
                                    : "default"
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
              <ArcadeButton
                variant="outline"
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                disabled={logPage === 1}
              >
                Previous
              </ArcadeButton>
              <span className="text-sm text-[var(--muted-foreground)]">
                Page {logPage} • {logsData?.total ?? 0} logs
              </span>
              <ArcadeButton
                variant="outline"
                onClick={() => setLogPage((p) => p + 1)}
                disabled={!logsData || logsData.logs.length < pageSize}
              >
                Next
              </ArcadeButton>
            </div>
          </div>
        </ArcadeCard>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {statsLoading ? (
            <ArcadeCard>
              <LoadingState message="Loading statistics..." centered />
            </ArcadeCard>
          ) : (
            <>
              {/* Overview */}
              <ArcadeCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                    Email Overview
                  </h3>
                  <div className="text-4xl font-bold text-[var(--primary)]">
                    {statsData?.total ?? 0}
                  </div>
                  <p className="text-[var(--muted-foreground)]">Total emails sent</p>
                </div>
              </ArcadeCard>

              {/* By Status */}
              <ArcadeCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                    By Status
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {(
                      ["pending", "sent", "delivered", "bounced", "complained", "failed"] as const
                    ).map((status) => (
                      <div key={status} className="text-center p-4 rounded-lg bg-[var(--muted)]/40">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {statsData?.byStatus[status] ?? 0}
                        </div>
                        <div className="text-sm text-[var(--muted-foreground)] capitalize">
                          {status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ArcadeCard>

              {/* By Type */}
              <ArcadeCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">By Type</h3>
                  {statsData?.byType && Object.keys(statsData.byType).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(statsData.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between p-4 rounded-lg bg-[var(--muted)]/40">
                          <span className="text-[var(--foreground)] capitalize">
                            {type.replace(/_/g, " ")}
                          </span>
                          <span className="font-bold text-[var(--foreground)]">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--muted-foreground)]">No email types found</p>
                  )}
                </div>
              </ArcadeCard>
            </>
          )}
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={composeDialog} onOpenChange={setComposeDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedUsers.size} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <ComposeForm />
          <DialogFooter>
            <ArcadeButton variant="outline" onClick={() => setComposeDialog(false)}>
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() => {
                // Form submission is handled by Formedible
              }}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
