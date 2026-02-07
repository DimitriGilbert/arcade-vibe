"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  ArrowUpDown,
  User,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

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

  // Fetch users (using mock data since user endpoint doesn't exist yet)
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: async () => {
      // Mock data for now - in production this would call actual endpoint
      return [
        {
          id: "1",
          name: "Alice Johnson",
          email: "alice@example.com",
          role: "participant" as const,
          credits: "500",
          isSuspended: false,
        },
        {
          id: "2",
          name: "Bob Smith",
          email: "bob@example.com",
          role: "participant" as const,
          credits: "1250",
          isSuspended: false,
        },
        {
          id: "3",
          name: "Charlie Brown",
          email: "charlie@example.com",
          role: "admin" as const,
          credits: "10000",
          isSuspended: false,
        },
      ] as User[];
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
          comparison = parseInt(a.credits) - parseInt(b.credits);
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
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage platform users
        </p>
      </div>

      {/* Search */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {[
                    { field: "name" as SortField, label: "Name" },
                    { field: "email" as SortField, label: "Email" },
                    { field: "role" as SortField, label: "Role" },
                    { field: "credits" as SortField, label: "Credits" },
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
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                            {user.name?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "outline"
                          }
                          className={cn(
                            "capitalize",
                            user.role === "admin" &&
                              "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                            user.role === "moderator" &&
                              "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                          )}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {parseInt(user.credits).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.isSuspended ? (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSuspendDialog({ open: true, user })}
                          disabled={user.isSuspended || user.role === "admin"}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Suspend
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!users || users.length < pageSize}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suspend User Dialog */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) =>
          !open && setSuspendDialog({ open: false, user: null })
        }
      >
        <DialogContent>
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
            <Button
              variant="outline"
              onClick={() => setSuspendDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Form submission is handled by Formedible
              }}
              disabled={suspendUserMutation.isPending}
            >
              {suspendUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Suspend User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "moderator" | "participant";
  credits: string;
  isSuspended: boolean;
};
