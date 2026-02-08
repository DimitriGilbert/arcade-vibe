"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  Calendar,
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
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import type { Theme, ThemeList } from "@/types/entities";
import LoadingState from "@/components/reusable/loading-state";
import { EmptyState } from "@/components/reusable/empty-state";

type SortField = "title" | "status" | "startDate";
type SortOrder = "asc" | "desc";

function themeListToTheme(theme: ThemeList): Theme {
  return {
    ...theme,
    systemPrompt: theme.systemPrompt || "",
    requirements: theme.requirements || null,
  };
}

export default function AdminThemesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    theme: ThemeList | null;
  }>({
    open: false,
    theme: null,
  });

  // Fetch all themes
  const {
    data: themes,
    isLoading,
    refetch,
  } = useQuery<ThemeList[]>({
    queryKey: ["admin-themes"],
    queryFn: async () => {
      return await trpcClient.themes.list.query();
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      description?: string;
      status?: "upcoming" | "active" | "frozen" | "archived";
      visibility?: "private" | "public_on_freeze" | "public";
      startDate?: Date | null;
      endDate?: Date | null;
      requirements?: Record<string, unknown>;
      systemPrompt?: string;
    }) => {
      return await trpcClient.themes.update.mutate(input);
    },
    onSuccess: () => {
      toast.success("Theme updated successfully!");
      refetch();
      setEditingTheme(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update theme");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      status: "upcoming" | "active" | "frozen" | "archived";
    }) => {
      return await trpcClient.themes.updateStatus.mutate(input);
    },
    onSuccess: () => {
      toast.success("Theme status updated!");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      status: "upcoming" | "active" | "frozen" | "archived";
      visibility: "private" | "public_on_freeze" | "public";
      startDate: Date | null;
      endDate: Date | null;
      requirements: Record<string, unknown>;
      systemPrompt: string;
    }) => {
      return await trpcClient.themes.create.mutate(input);
    },
    onSuccess: () => {
      toast.success("Theme created successfully!");
      refetch();
      setEditingTheme(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create theme");
    },
  });

  // Filter and sort themes
  const filteredThemes = (themes || [])
    .filter((theme) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        theme.title.toLowerCase().includes(query) ||
        theme.description.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "startDate": {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
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

  const ThemeForm = () => {
    const schema = z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(255),
      description: z.string().min(1),
      status: z.enum(["upcoming", "active", "frozen", "archived"]),
      visibility: z.enum(["private", "public_on_freeze", "public"]),
      startDate: z.date().nullable(),
      endDate: z.date().nullable(),
      requirements: z.record(z.string(), z.unknown()),
      systemPrompt: z.string().min(1),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        { name: "title", type: "text", label: "Theme Title" },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          textareaConfig: { rows: 3 },
        },
        {
          name: "status",
          type: "select",
          label: "Status",
          options: [
            { value: "upcoming", label: "Upcoming" },
            { value: "active", label: "Active" },
            { value: "frozen", label: "Frozen" },
            { value: "archived", label: "Archived" },
          ],
        },
        {
          name: "visibility",
          type: "select",
          label: "Visibility",
          options: [
            { value: "private", label: "Private (Admin Only)" },
            { value: "public_on_freeze", label: "Public on Freeze" },
            { value: "public", label: "Public" },
          ],
        },
        { name: "startDate", type: "date", label: "Start Date" },
        { name: "endDate", type: "date", label: "End Date" },
        {
          name: "systemPrompt",
          type: "textarea",
          label: "System Prompt",
          textareaConfig: { rows: 4 },
        },
      ],
      formOptions: {
        defaultValues: editingTheme
          ? {
              id: editingTheme.id,
              title: editingTheme.title,
              description: editingTheme.description,
              status: editingTheme.status,
              visibility: editingTheme.visibility,
              startDate: editingTheme.startDate
                ? new Date(editingTheme.startDate)
                : null,
              endDate: editingTheme.endDate
                ? new Date(editingTheme.endDate)
                : null,
              requirements: editingTheme.requirements || {},
              systemPrompt: editingTheme.systemPrompt || "",
            }
          : {
              title: "",
              description: "",
              status: "upcoming" as const,
              visibility: "private" as const,
              startDate: null,
              endDate: null,
              requirements: {},
              systemPrompt: "",
            },
        onSubmit: async ({ value }) => {
          if (value.id) {
            const updateInput = {
              id: value.id,
              title: value.title,
              description: value.description,
              status: value.status,
              visibility: value.visibility,
              startDate: value.startDate,
              endDate: value.endDate,
              requirements: value.requirements,
              systemPrompt: value.systemPrompt,
            };
            await updateThemeMutation.mutateAsync(updateInput);
          } else {
            await createThemeMutation.mutateAsync(value);
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
          message="Loading themes..."
          variant="accent"
          centered
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Themes
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Manage competition themes
          </p>
        </div>
        <ArcadeButton
          variant="primary"
          onClick={() =>
            setEditingTheme({
              id: "",
              title: "",
              description: "",
              status: "upcoming",
              visibility: "private",
              startDate: null,
              endDate: null,
              requirements: null,
              systemPrompt: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add Theme
        </ArcadeButton>
      </div>

      {/* Search */}
      <ArcadeCard>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <ArcadeInput
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </ArcadeCard>

      {/* Themes Table */}
      <ArcadeCard>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[
                    { field: "title" as SortField, label: "Title" },
                    { field: "status" as SortField, label: "Status" },
                    { field: "startDate" as SortField, label: "Start Date" },
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
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--muted-foreground)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredThemes.length === 0 ? (
                  <tr>
                    <EmptyState
                      variant="table"
                      colSpan={5}
                      message="No themes found"
                    />
                  </tr>
                ) : (
                  filteredThemes.map((theme) => (
                    <tr
                      key={theme.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{theme.title}</div>
                        <div className="text-xs text-[var(--muted-foreground)] line-clamp-1 max-w-[200px]">
                          {theme.description}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ArcadeBadge
                          text={theme.status}
                          variant={
                            theme.status === "active" ? "neon" : "default"
                          }
                          className="capitalize"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {theme.startDate
                            ? new Date(theme.startDate).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ArcadeBadge
                          text={theme.visibility.replace(/_/g, " ")}
                          variant="default"
                          className="capitalize"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ArcadeButton
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingTheme(themeListToTheme(theme))
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </ArcadeButton>
                          <ArcadeButton
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, theme })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                          </ArcadeButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ArcadeCard>

      {/* Edit Theme Dialog */}
      <Dialog
        open={!!editingTheme}
        onOpenChange={(open) => !open && setEditingTheme(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTheme?.id ? "Edit Theme" : "Create Theme"}
            </DialogTitle>
            <DialogDescription>
              {editingTheme?.id
                ? "Update theme configuration"
                : "Create a new competition theme"}
            </DialogDescription>
          </DialogHeader>
          <ThemeForm />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, theme: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.theme?.title}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, theme: null })}
            >
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() => {
                toast.info("Delete theme feature not yet implemented");
                setDeleteDialog({ open: false, theme: null });
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
