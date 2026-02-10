"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  CheckCircle,
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
import { LoadingState, EmptyState } from "@/components/reusable";
import { z } from "zod";

type SortField = "name" | "price" | "credits";
type SortOrder = "asc" | "desc";

export default function AdminPlansPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("price");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [addingPlan, setAddingPlan] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    plan: Plan | null;
  }>({
    open: false,
    plan: null,
  });

  // Fetch all plans
  const {
    data: plans,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      return await trpcClient.admin.plans.getPlans.query();
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      price: number;
      credits: number;
      features: string[];
      isOneTime?: boolean;
      isPopular?: boolean;
    }) => {
      return await trpcClient.admin.plans.updatePlan.mutate(input);
    },
    onSuccess: () => {
      toast.success("Plan updated successfully!");
      refetch();
      setEditingPlan(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update plan");
    },
  });

  // Add plan mutation
  const addPlanMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      price: number;
      credits: number;
      features: string[];
      isOneTime?: boolean;
      isPopular?: boolean;
    }) => {
      return await trpcClient.admin.plans.addPlan.mutate(input);
    },
    onSuccess: () => {
      toast.success("Plan added successfully!");
      refetch();
      setAddingPlan(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add plan");
    },
  });

  // Delete plan mutation (placeholder - not implemented in backend yet)
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      toast.info("Delete plan feature not yet implemented");
      return null;
    },
    onSuccess: () => {
      toast.success("Plan deleted successfully!");
      refetch();
      setDeleteDialog({ open: false, plan: null });
    },
  });

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    if (!plans) return [];

    let result = [...plans];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (plan) =>
          plan.name.toLowerCase().includes(query) ||
          (plan.features || []).some((f: string) =>
            f.toLowerCase().includes(query),
          ),
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "credits":
          comparison = a.credits - b.credits;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [plans, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const PlanForm = () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      price: z.number().int().min(0),
      credits: z.number().int().min(0),
      features: z.array(z.string()),
      isOneTime: z.boolean(),
      isPopular: z.boolean(),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        { name: "name", type: "text", label: "Plan Name", disabled: true },
        { name: "price", type: "number", label: "Price (USD cents)", min: 0 },
        { name: "credits", type: "number", label: "Credits per Month", min: 0 },
        {
          name: "isOneTime",
          type: "switch",
          label: "One-time Purchase",
          description: "This is a one-time credit purchase, not a subscription",
        },
        {
          name: "isPopular",
          type: "switch",
          label: "Popular",
          description: "Mark this plan as the popular choice",
        },
        {
          name: "features",
          type: "array",
          label: "Features",
          arrayConfig: {
            itemType: "text",
            itemLabel: "Feature",
            addButtonLabel: "Add Feature",
            objectConfig: {
              fields: [{ name: "value", type: "text", label: "Feature" }],
            },
          },
        },
      ],
      formOptions: {
        defaultValues: editingPlan
          ? {
              id: editingPlan.id,
              name: editingPlan.name,
              price: editingPlan.price,
              credits: editingPlan.credits,
              features: editingPlan.features || [],
              isOneTime: editingPlan.isOneTime ?? false,
              isPopular: editingPlan.isPopular ?? false,
            }
          : {
              id: "",
              name: "",
              price: 0,
              credits: 0,
              features: [],
              isOneTime: false,
              isPopular: false,
            },
        onSubmit: async ({ value }) => {
          await updatePlanMutation.mutateAsync({
            id: value.id,
            price: value.price,
            credits: value.credits,
            features: value.features,
            isOneTime: value.isOneTime,
            isPopular: value.isPopular,
          });
        },
      },
    });

    return <Form className="space-y-4" />;
  };

  const AddPlanForm = () => {
    const schema = z.object({
      name: z.string().min(1, "Plan name is required"),
      price: z.number().int().min(0),
      credits: z.number().int().min(0),
      features: z.array(z.string()),
      isOneTime: z.boolean(),
      isPopular: z.boolean(),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "name",
          type: "text",
          label: "Plan Name",
          placeholder: "e.g., Pro",
        },
        {
          name: "price",
          type: "number",
          label: "Price (USD cents)",
          min: 0,
          placeholder: "e.g., 999 for $9.99",
        },
        {
          name: "credits",
          type: "number",
          label: "Credits per Month",
          min: 0,
          placeholder: "e.g., 1000",
        },
        {
          name: "isOneTime",
          type: "switch",
          label: "One-time Purchase",
          description: "This is a one-time credit purchase, not a subscription",
        },
        {
          name: "isPopular",
          type: "switch",
          label: "Popular",
          description: "Mark this plan as the popular choice",
        },
        {
          name: "features",
          type: "array",
          label: "Features",
          arrayConfig: {
            itemType: "text",
            itemLabel: "Feature",
            addButtonLabel: "Add Feature",
            objectConfig: {
              fields: [{ name: "value", type: "text", label: "Feature" }],
            },
          },
        },
      ],
      formOptions: {
        defaultValues: {
          name: "",
          price: 0,
          credits: 0,
          features: [],
          isOneTime: false,
          isPopular: false,
        },
        onSubmit: async ({ value }) => {
          await addPlanMutation.mutateAsync({
            name: value.name,
            price: value.price,
            credits: value.credits,
            features: value.features,
            isOneTime: value.isOneTime,
            isPopular: value.isPopular,
          });
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
          variant="accent"
          message="Loading plans..."
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
            Subscription Plans
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Manage subscription plans and pricing
          </p>
        </div>
        <ArcadeButton variant="primary" onClick={() => setAddingPlan(true)}>
          <Plus className="h-4 w-4" />
          Add Plan
        </ArcadeButton>
      </div>

      {/* Search and Filters */}
      <ArcadeCard>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <ArcadeInput
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </ArcadeCard>

      {/* Plans Table */}
      <ArcadeCard>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[
                    { field: "name" as SortField, label: "Plan Name" },
                    { field: "price" as SortField, label: "Price" },
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
                    Features
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--muted-foreground)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr>
                    <EmptyState
                      variant="table"
                      message="No plans found"
                      colSpan={6}
                    />
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{plan.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        ${Math.floor(plan.price / 100)}.
                        {(plan.price % 100).toString().padStart(2, "0")}/mo
                      </td>
                      <td className="px-4 py-3">
                        {plan.credits.toLocaleString()} credits
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(plan.features || [])
                            .slice(0, 2)
                            .map((feature, index) => (
                              <ArcadeBadge
                                key={`${plan.id}-${feature}`}
                                text={feature}
                                variant="default"
                                className="text-xs"
                              />
                            ))}
                          {(plan.features?.length || 0) > 2 && (
                            <ArcadeBadge
                              text={`+${plan.features!.length - 2} more`}
                              variant="pixel"
                              className="text-xs"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ArcadeBadge
                          text="Active"
                          variant="neon"
                          icon={<CheckCircle className="h-3 w-3" />}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ArcadeButton
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPlan(plan)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </ArcadeButton>
                          <ArcadeButton
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, plan })
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

      {/* Edit Plan Dialog */}
      <Dialog
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update subscription plan configuration
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
        </DialogContent>
      </Dialog>

      {/* Add Plan Dialog */}
      <Dialog open={addingPlan} onOpenChange={setAddingPlan}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan
            </DialogDescription>
          </DialogHeader>
          <AddPlanForm />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, plan: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.plan?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, plan: null })}
            >
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() =>
                deleteDialog.plan &&
                deletePlanMutation.mutate(deleteDialog.plan.id)
              }
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Plan = {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[] | null;
  stripePriceId: string | null;
  isOneTime: boolean | null;
  isPopular: boolean | null;
  createdAt: string;
  updatedAt: string;
};
