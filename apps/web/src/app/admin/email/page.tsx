"use client";

import { useState, useMemo, useCallback } from "react";
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
  Eye,
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

export default function AdminEmailPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "logs" | "stats">("compose");
  const [filters, setFilters] = useState<UserFilterInput>({});
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [composeDialog, setComposeDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [logStatusFilter, setLogStatusFilter] = useState<
    "pending" | "sent" | "delivered" | "bounced" | "complained" | "failed" | undefined
  >(undefined);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewText, setPreviewText] = useState("");
  const pageSize = 50;
  const queryClient = useQueryClient();

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

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-email-stats"],
    queryFn: async () => {
      return await trpcClient.admin.email.getStats.query({});
    },
    enabled: activeTab === "stats",
  });

  const previewMutation = useMutation({
    mutationFn: async (variables: Record<string, unknown>) => {
      return await trpcClient.admin.email.previewTemplate.mutate({
        templateId: variables.templateId as string,
        variables,
      });
    },
    onSuccess: (data) => {
      setPreviewHtml(data.html);
      setPreviewText(data.text);
      setPreviewDialog(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to preview");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (variables: { templateId: string; subject: string; content: string }) => {
      return await trpcClient.admin.email.sendToUsers.mutate({
        userIds: Array.from(selectedUsers),
        templateId: variables.templateId as "welcome" | "broadcast" | "custom",
        subject: variables.subject,
        content: variables.content,
        variables: {},
      });
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

  const ComposeEmailForm = () => {
    const schema = z.object({
      templateId: z.enum(["welcome", "broadcast", "custom"]),
      subject: z.string().min(1, "Subject is required").max(200),
      content: z.string().min(1, "Content is required"),
      ctaText: z.string().optional(),
      ctaUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    });

    const handlePreview = useCallback((values: Record<string, unknown>) => {
      previewMutation.mutate({
        ...values,
        userName: "Preview User",
      });
    }, []);

    const handleSubmit = useCallback(
      async ({ value }: { value: Record<string, unknown> }) => {
        await sendEmailMutation.mutateAsync({
          templateId: value.templateId as string,
          subject: value.subject as string,
          content: value.content as string,
        });
      },
      [],
    );

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "templateId",
          type: "radio",
          label: "Template",
          tab: "template",
          options: [
            { value: "broadcast", label: "Broadcast - Send announcements to users" },
            { value: "welcome", label: "Welcome - Welcome new users" },
            { value: "custom", label: "Custom HTML - Write your own HTML" },
          ],
        },
        {
          name: "subject",
          type: "text",
          label: "Subject Line",
          tab: "content",
          description: "The subject line recipients will see",
        },
        {
          name: "content",
          type: "textarea",
          label: "Email Content",
          tab: "content",
          description: "Use {{user.name}}, {{user.email}}, {{user.credits}}, etc. for personalization",
          textareaConfig: {
            rows: 12,
            showWordCount: true,
          },
          conditional: (values) => values.templateId !== "custom",
        },
        {
          name: "content",
          type: "textarea",
          label: "HTML Content",
          tab: "content",
          description: "Write raw HTML. Use {{userName}} for personalization.",
          textareaConfig: {
            rows: 12,
            showWordCount: true,
          },
          conditional: (values) => values.templateId === "custom",
        },
        {
          name: "ctaText",
          type: "text",
          label: "Button Text",
          tab: "content",
          placeholder: "e.g., Click Here, Learn More",
          conditional: (values) => values.templateId === "broadcast",
        },
        {
          name: "ctaUrl",
          type: "text",
          label: "Button URL",
          tab: "content",
          placeholder: "https://example.com",
          conditional: (values) => values.templateId === "broadcast" && !!values.ctaText,
        },
      ],
      tabs: [
        { id: "template", label: "Template", description: "Choose an email template" },
        { id: "content", label: "Content", description: "Write your email content" },
      ],
      formOptions: {
        defaultValues: {
          templateId: "broadcast" as const,
          subject: "",
          content: "",
          ctaText: "",
          ctaUrl: "",
        },
        onSubmit: handleSubmit,
      },
      submitLabel: `Send to ${selectedUsers.size} users`,
    });

    return <Form className="space-y-4" />;
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Email Management</h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Send emails to users and track delivery status
        </p>
      </div>

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

      {activeTab === "compose" && (
        <>
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

          {showFilters && <FilterPanel />}

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

      {activeTab === "logs" && (
        <ArcadeCard>
          <div className="p-6">
            <div className="mb-4">
              <span className="text-sm text-[var(--muted-foreground)] mr-2">Filter by Status:</span>
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

      {activeTab === "stats" && (
        <div className="space-y-6">
          {statsLoading ? (
            <ArcadeCard>
              <LoadingState message="Loading statistics..." centered />
            </ArcadeCard>
          ) : (
            <>
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

              <ArcadeCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">By Status</h3>
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

      <Dialog open={composeDialog} onOpenChange={setComposeDialog}>
        <DialogContent
          className="p-0 gap-0 min-w-7xl"
        >
          <DialogHeader className="p-6 pb-4 border-b border-[var(--border)] shrink-0">
            <DialogTitle className="text-xl">Compose Email</DialogTitle>
            <DialogDescription>
              Send to {selectedUsers.size} selected user(s). Templates have access to full user object via {"{{user.name}}"}, {"{{user.email}}"}, {"{{user.credits}}"}, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6" style={{ height: "calc(92vh - 140px)" }}>
            <ComposeEmailForm />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent
          className=" min-w-7xl p-0 gap-0"
        >
          <DialogHeader className="p-6 pb-4 border-b border-[var(--border)] shrink-0">
            <DialogTitle className="text-xl">Email Preview</DialogTitle>
            <DialogDescription>How your email will look to recipients</DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: "calc(92vh - 180px)" }}>
            <div className="w-1/2 flex flex-col min-h-0 border-r border-[var(--border)]">
              <div className="p-2 bg-[var(--muted)]/50 text-sm font-medium text-[var(--foreground)] shrink-0">
                HTML Preview
              </div>
              <div className="flex-1 overflow-auto p-4 bg-white">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Email Preview"
                />
              </div>
            </div>

            <div className="w-1/2 shrink-0 flex flex-col min-h-0">
              <div className="p-2 bg-[var(--muted)]/50 text-sm font-medium text-[var(--foreground)] shrink-0">
                Plain Text
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono">
                  {previewText}
                </pre>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[var(--border)] flex justify-end shrink-0">
            <ArcadeButton variant="outline" onClick={() => setPreviewDialog(false)}>
              Close
            </ArcadeButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
