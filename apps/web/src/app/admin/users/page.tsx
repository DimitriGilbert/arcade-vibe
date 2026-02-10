"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  ArrowUpDown,
  Shield,
  AlertTriangle,
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
import { LoadingState } from "@/components/reusable";
import { EmptyState } from "@/components/reusable";
import UserAvatar from "@/components/reusable/user-avatar";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import type { UserAdminView as User } from "@/types/entities";

type SortField = "name" | "email" | "role" | "credits";
type SortOrder = "asc" | "desc";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: async () => {
      return await trpcClient.admin.direct.getUsers.query({
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async (input: {
      userId: string;
      reason: string;
      duration: string;
    }) => {
      return await trpcClient.admin.direct.suspendUser.mutate({
        userId: input.userId,
        reason: input.reason,
        duration: input.duration as "7d" | "30d" | "permanent",
      });
    },
    onSuccess: () => {
      toast.success("User suspended successfully!");
      setSuspendDialog({ open: false, user: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend user");
    },
  });

  // Filter and sort users
  const filteredUsers = (users || [])
    .filter((user) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "credits":
          comparison = a.credits - b.credits;
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

  const UserSuspensionForm = () => {
    const schema = z.object({
      reason: z.string().min(10).max(500),
      duration: z.enum(["7d", "30d", "permanent"]),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "reason",
          type: "textarea",
          label: "Reason for Suspension",
          textareaConfig: { rows: 3, maxLength: 500 },
        },
        {
          name: "duration",
          type: "select",
          label: "Suspension Duration",
          options: [
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "permanent", label: "Permanent" },
          ],
        },
      ],
      formOptions: {
        defaultValues: {
          reason: "",
          duration: "7d" as const,
        },
        onSubmit: async ({ value }) => {
          if (suspendDialog.user) {
            await suspendUserMutation.mutateAsync({
              userId: suspendDialog.user.id,
              reason: value.reason,
              duration: value.duration,
            });
          }
        },
      },
    });

    return <Form className="space-y-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState
          size="lg"
          message="Loading users..."
          variant="accent"
          centered
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          User Management
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          View and manage platform users
        </p>
      </div>

      {/* Search */}
      <ArcadeCard>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <ArcadeInput
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </ArcadeCard>

      {/* Users Table */}
      <ArcadeCard>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[
                    { field: "name" as SortField, label: "Name" },
                    { field: "email" as SortField, label: "Email" },
                    { field: "role" as SortField, label: "Role" },
                    { field: "credits" as SortField, label: "Credits" },
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
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--muted-foreground)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <EmptyState
                      variant="table"
                      colSpan={6}
                      message="No users found"
                    />
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user} size="xs" />
                          <div>
                            <div className="font-medium">
                              {user.name || "Unknown"}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ArcadeBadge
                          text={user.role}
                          variant={
                            user.role === "admin"
                              ? "neon"
                              : user.role === "moderator"
                                ? "default"
                                : "pixel"
                          }
                          className="capitalize"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {user.credits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.isSuspended ? (
                          <ArcadeBadge
                            text="Suspended"
                            variant="pixel"
                            icon={<Shield className="h-3 w-3" />}
                          />
                        ) : (
                          <ArcadeBadge text="Active" variant="neon" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ArcadeButton
                          variant="outline"
                          size="sm"
                          onClick={() => setSuspendDialog({ open: true, user })}
                          disabled={user.isSuspended || user.role === "admin"}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Suspend
                        </ArcadeButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
            <ArcadeButton
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </ArcadeButton>
            <span className="text-sm text-[var(--muted-foreground)]">
              Page {page}
            </span>
            <ArcadeButton
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!users || users.length < pageSize}
            >
              Next
            </ArcadeButton>
          </div>
        </div>
      </ArcadeCard>

      {/* Suspend User Dialog */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) =>
          !open && setSuspendDialog({ open: false, user: null })
        }
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend{" "}
              <span className="font-medium">{suspendDialog.user?.email}</span>{" "}
              from accessing the platform
            </DialogDescription>
          </DialogHeader>
          <UserSuspensionForm />
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setSuspendDialog({ open: false, user: null })}
            >
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() => {
                // Form submission is handled by Formedible
              }}
              disabled={suspendUserMutation.isPending}
            >
              {suspendUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Suspend User
                </>
              )}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
