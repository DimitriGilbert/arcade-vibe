"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Trash2,
  Globe,
  Lock,
  CheckCircle2,
  XCircle,
  Code,
  Shield,
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
import { LoadingState, EmptyState } from "@/components/reusable";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

type SortField = "name" | "category" | "status";
type SortOrder = "asc" | "desc";

export default function AdminLibraryPatternsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingPattern, setEditingPattern] = useState<LibraryPattern | null>(
    null,
  );
  const [addingPattern, setAddingPattern] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    pattern: LibraryPattern | null;
  }>({
    open: false,
    pattern: null,
  });

  const {
    data: patterns,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-library-patterns"],
    queryFn: async () => {
      return await trpcClient.admin.libraryPatterns.list.query();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      urlPattern: string;
      category:
        | "game_engine"
        | "physics"
        | "audio"
        | "graphics"
        | "utility"
        | "analytics"
        | "other";
      isGlobal: boolean;
    }) => {
      return await trpcClient.admin.libraryPatterns.create.mutate(input);
    },
    onSuccess: () => {
      toast.success("Library pattern created successfully!");
      refetch();
      setAddingPattern(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create library pattern");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      urlPattern?: string;
      category?:
        | "game_engine"
        | "physics"
        | "audio"
        | "graphics"
        | "utility"
        | "analytics"
        | "other";
      isGlobal?: boolean;
      status?: "active" | "disabled";
    }) => {
      return await trpcClient.admin.libraryPatterns.update.mutate(input);
    },
    onSuccess: () => {
      toast.success("Library pattern updated successfully!");
      refetch();
      setEditingPattern(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update library pattern");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.admin.libraryPatterns.delete.mutate({ id });
    },
    onSuccess: () => {
      toast.success("Library pattern deleted successfully!");
      refetch();
      setDeleteDialog({ open: false, pattern: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete library pattern");
    },
  });

  const filteredPatterns = useMemo(() => {
    if (!patterns) return [];

    let result = [...patterns];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(query) ||
          pattern.description.toLowerCase().includes(query) ||
          pattern.urlPattern.toLowerCase().includes(query),
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [patterns, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const PatternForm = () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      description: z.string().min(1),
      urlPattern: z.string().min(1),
      category: z.enum([
        "game_engine",
        "physics",
        "audio",
        "graphics",
        "utility",
        "analytics",
        "other",
      ]),
      isGlobal: z.boolean(),
      status: z.enum(["active", "disabled"]),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "name",
          type: "text",
          label: "Name",
          placeholder: "e.g., Phaser 3",
          disabled: !!editingPattern,
        },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          placeholder: "Describe what this library does",
          textareaConfig: {
            rows: 3,
          },
        },
        {
          name: "urlPattern",
          type: "textarea",
          label: "URL Pattern (Regex)",
          placeholder: `^https://cdn\\.jsdelivr\\.net/npm/phaser@.*\\.js$`,
          textareaConfig: {
            rows: 2,
          },
        },
        {
          name: "category",
          type: "select",
          label: "Category",
          options: [
            { value: "game_engine", label: "Game Engine" },
            { value: "physics", label: "Physics" },
            { value: "audio", label: "Audio" },
            { value: "graphics", label: "Graphics" },
            { value: "utility", label: "Utility" },
            { value: "analytics", label: "Analytics" },
            { value: "other", label: "Other" },
          ],
        },
        {
          name: "isGlobal",
          type: "switch",
          label: "Global Pattern",
          description: "Available to all themes if enabled",
        },
        ...(editingPattern
          ? [
              {
                name: "status" as const,
                type: "select" as const,
                label: "Status",
                options: [
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                ],
              },
            ]
          : []),
      ],
      formOptions: {
        defaultValues: editingPattern
          ? {
              id: editingPattern.id,
              name: editingPattern.name,
              description: editingPattern.description,
              urlPattern: editingPattern.urlPattern,
              category: editingPattern.category,
              isGlobal: editingPattern.isGlobal,
              status: editingPattern.status,
            }
          : {
              id: "",
              name: "",
              description: "",
              urlPattern: "",
              category: "game_engine" as const,
              isGlobal: false,
              status: "active" as const,
            },
        onSubmit: async ({ value }) => {
          if (editingPattern) {
            await updateMutation.mutateAsync({
              id: value.id,
              name: value.name,
              description: value.description,
              urlPattern: value.urlPattern,
              category: value.category,
              isGlobal: value.isGlobal,
              status: value.status,
            });
          } else {
            await createMutation.mutateAsync({
              name: value.name,
              description: value.description,
              urlPattern: value.urlPattern,
              category: value.category,
              isGlobal: value.isGlobal,
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
          message="Loading library patterns..."
          variant="accent"
          centered
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Library Patterns
          </h1>
          <p className="text-muted-foreground">
            Manage allowed library patterns for game generation
          </p>
        </div>
        <ArcadeButton onClick={() => setAddingPattern(true)} variant="primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Pattern
        </ArcadeButton>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <ArcadeInput
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ArcadeCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {[
                  { field: "name" as SortField, label: "Name" },
                  { field: "category" as SortField, label: "Category" },
                  { field: "status" as SortField, label: "Status" },
                ].map((column) => (
                  <th
                    key={column.field}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort(column.field)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  URL Pattern
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Scope
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Themes
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.length === 0 ? (
                <EmptyState
                  variant="table"
                  colSpan={7}
                  message="No library patterns found"
                />
              ) : (
                filteredPatterns.map((pattern) => (
                  <tr key={pattern.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{pattern.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {pattern.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ArcadeBadge text={pattern.category} />
                    </td>
                    <td className="px-4 py-3">
                      {pattern.status === "active" ? (
                        <ArcadeBadge
                          text="Active"
                          icon={<CheckCircle2 className="h-3 w-3" />}
                        />
                      ) : (
                        <ArcadeBadge
                          text="Disabled"
                          icon={<XCircle className="h-3 w-3" />}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {pattern.urlPattern}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {pattern.isGlobal ? (
                        <ArcadeBadge
                          text="Global"
                          icon={<Globe className="h-3 w-3" />}
                        />
                      ) : (
                        <ArcadeBadge
                          text="Theme-specific"
                          icon={<Lock className="h-3 w-3" />}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pattern.isGlobal ? (
                        <span className="text-xs text-muted-foreground">
                          All themes
                        </span>
                      ) : (
                        <span className="text-xs">
                          {(pattern as any).themePatterns?.length ?? 0} themes
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ArcadeButton
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPattern(pattern)}
                        >
                          <Code className="h-4 w-4" />
                        </ArcadeButton>
                        <ArcadeButton
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({ open: true, pattern })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </ArcadeButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ArcadeCard>

      <Dialog
        open={!!editingPattern}
        onOpenChange={(open) => !open && setEditingPattern(null)}
      >
        <DialogContent className="sm:max-w-[896px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Library Pattern</DialogTitle>
            <DialogDescription>
              Update library pattern settings
            </DialogDescription>
          </DialogHeader>
          <PatternForm />
        </DialogContent>
      </Dialog>

      <Dialog open={addingPattern} onOpenChange={setAddingPattern}>
        <DialogContent className="sm:max-w-[896px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Library Pattern</DialogTitle>
            <DialogDescription>
              Add a new library pattern for game generation
            </DialogDescription>
          </DialogHeader>
          <PatternForm />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, pattern: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Library Pattern</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.pattern?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, pattern: null })}
            >
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() =>
                deleteDialog.pattern &&
                deleteMutation.mutate(deleteDialog.pattern.id)
              }
            >
              Delete
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type LibraryPattern = {
  id: string;
  name: string;
  description: string;
  urlPattern: string;
  category:
    | "game_engine"
    | "physics"
    | "audio"
    | "graphics"
    | "utility"
    | "analytics"
    | "other";
  isGlobal: boolean;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  themePatterns?: Array<{
    theme: {
      id: string;
      title: string;
    };
  }>;
};
