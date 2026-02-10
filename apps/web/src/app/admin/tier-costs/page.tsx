"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Trash2, Edit } from "lucide-react";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeInput,
  ArcadeBadge,
} from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

interface TierCost {
  id: string;
  slug: string;
  name: string;
  creditCost: number;
  description: string | null;
  scoreMultiplier: number;
  displayOrder: number;
  colorClass: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTierCostsPage() {
  const queryClient = useQueryClient();
  const [editingTierCost, setEditingTierCost] = useState<TierCost | null>(null);
  const [addingTierCost, setAddingTierCost] = useState(false);
  const [editedCosts, setEditedCosts] = useState<Record<string, number>>({});

  // Fetch tier costs
  const { data: tierCosts, isLoading } = useQuery({
    queryKey: ["admin-tier-costs"],
    queryFn: async () => {
      return (await trpcClient.admin.tierCosts.list.query()) as TierCost[];
    },
  });

  // Update tier cost mutation
  const updateTierCostMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      creditCost?: number;
      description?: string;
      scoreMultiplier?: number;
      displayOrder?: number;
      colorClass?: string;
    }) => {
      return await trpcClient.admin.tierCosts.update.mutate(input);
    },
    onSuccess: () => {
      toast.success("Tier cost updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-tier-costs"] });
      setEditedCosts({});
      setEditingTierCost(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update tier cost");
    },
  });

  // Create tier cost mutation
  const createTierCostMutation = useMutation({
    mutationFn: async (input: {
      slug: string;
      name: string;
      creditCost: number;
      description?: string;
      scoreMultiplier: number;
      displayOrder: number;
      colorClass?: string;
    }) => {
      return await trpcClient.admin.tierCosts.create.mutate(input);
    },
    onSuccess: () => {
      toast.success("Tier cost created!");
      queryClient.invalidateQueries({ queryKey: ["admin-tier-costs"] });
      setAddingTierCost(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create tier cost");
    },
  });

  // Delete tier cost mutation (soft delete)
  const deleteTierCostMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.admin.tierCosts.delete.mutate(input);
    },
    onSuccess: () => {
      toast.success("Tier cost deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-tier-costs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete tier cost");
    },
  });

  const handleCostChange = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setEditedCosts((prev) => ({ ...prev, [id]: numValue }));
    }
  };

  const handleSave = (tierCost: TierCost) => {
    const newCost = editedCosts[tierCost.id];
    if (newCost && newCost > 0) {
      updateTierCostMutation.mutate({ id: tierCost.id, creditCost: newCost });
    }
  };

  const handleDelete = (tierCost: TierCost) => {
    if (
      confirm(
        `Are you sure you want to delete "${tierCost.name}"? This will soft delete it.`,
      )
    ) {
      deleteTierCostMutation.mutate({ id: tierCost.id });
    }
  };

  const TierCostForm = ({
    mode,
    tierCost,
  }: {
    mode: "add" | "edit";
    tierCost?: TierCost;
  }) => {
    const isAddMode = mode === "add";

    const schema = z.object({
      id: z.string().uuid().optional(),
      slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z_]+$/, "Slug must be lowercase with underscores only"),
      name: z.string().min(1).max(100),
      creditCost: z.number().int().positive(),
      description: z.string().optional(),
      scoreMultiplier: z.number().positive(),
      displayOrder: z.number().int(),
      colorClass: z.string().optional(),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "slug",
          type: "text",
          label: "Slug (lowercase, underscores)",
          disabled: !isAddMode,
        },
        { name: "name", type: "text", label: "Display Name" },
        { name: "creditCost", type: "number", label: "Credit Cost", min: 1 },
        {
          name: "description",
          type: "textarea",
          label: "Description (optional)",
        },
        {
          name: "scoreMultiplier",
          type: "number",
          label: "Score Multiplier",
          min: 0.1,
          step: 0.1,
        },
        {
          name: "displayOrder",
          type: "number",
          label: "Display Order",
          min: 0,
        },
        {
          name: "colorClass",
          type: "text",
          label: "Color Class (Tailwind, optional)",
          placeholder: "e.g., bg-green-500/20 text-green-400",
        },
      ],
      formOptions: {
        defaultValues: isAddMode
          ? {
              slug: "",
              name: "",
              creditCost: 10,
              description: "",
              scoreMultiplier: 1.0,
              displayOrder: 0,
              colorClass: "",
            }
          : tierCost
            ? {
                id: tierCost.id,
                slug: tierCost.slug,
                name: tierCost.name,
                creditCost: tierCost.creditCost,
                description: tierCost.description ?? "",
                scoreMultiplier: tierCost.scoreMultiplier,
                displayOrder: tierCost.displayOrder,
                colorClass: tierCost.colorClass ?? "",
              }
            : undefined,
        onSubmit: async ({ value }) => {
          if (isAddMode) {
            await createTierCostMutation.mutateAsync({
              slug: value.slug,
              name: value.name,
              creditCost: value.creditCost,
              description: value.description || undefined,
              scoreMultiplier: value.scoreMultiplier,
              displayOrder: value.displayOrder,
              colorClass: value.colorClass || undefined,
            });
          } else {
            if (value.id) {
              await updateTierCostMutation.mutateAsync({
                id: value.id,
                name: value.name,
                creditCost: value.creditCost,
                description: value.description || undefined,
                scoreMultiplier: value.scoreMultiplier,
                displayOrder: value.displayOrder,
                colorClass: value.colorClass || undefined,
              });
            }
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
          variant="accent"
          message="Loading tier costs..."
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
            Tier Costs
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Configure credit costs for game generation by model tier
          </p>
        </div>
        <ArcadeButton variant="primary" onClick={() => setAddingTierCost(true)}>
          <Plus className="h-4 w-4" />
          Create New Tier Cost
        </ArcadeButton>
      </div>

      {/* Tier Costs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tierCosts?.map((tierCost) => {
          const editedCost = editedCosts[tierCost.id];
          const displayCost = editedCost ?? tierCost.creditCost;
          const hasChanges =
            editedCost !== undefined && editedCost !== tierCost.creditCost;

          return (
            <ArcadeCard key={tierCost.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <ArcadeBadge
                    text={tierCost.name}
                    className={
                      tierCost.colorClass ??
                      "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {tierCost.slug}
                  </span>
                </div>

                {tierCost.description && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {tierCost.description}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-[var(--muted-foreground)]">
                    Credit Cost
                  </label>
                  <ArcadeInput
                    type="number"
                    min={1}
                    value={displayCost}
                    onChange={(e) =>
                      handleCostChange(tierCost.id, e.target.value)
                    }
                    className={hasChanges ? "border-[var(--accent)]" : ""}
                  />
                </div>

                <div className="text-xs text-[var(--muted-foreground)] space-y-1">
                  <div>Score Multiplier: {tierCost.scoreMultiplier}x</div>
                  <div>Display Order: {tierCost.displayOrder}</div>
                </div>

                <div className="flex gap-2">
                  <ArcadeButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(tierCost)}
                    disabled={!hasChanges || updateTierCostMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </ArcadeButton>
                  <ArcadeButton
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTierCost(tierCost)}
                  >
                    <Edit className="h-3 w-3" />
                  </ArcadeButton>
                  <ArcadeButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tierCost)}
                    disabled={deleteTierCostMutation.isPending}
                    className="text-red-500 hover:text-red-600 border-red-500/50 hover:border-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </ArcadeButton>
                </div>
              </div>
            </ArcadeCard>
          );
        })}
      </div>

      {/* Empty State */}
      {tierCosts && tierCosts.length === 0 && (
        <ArcadeCard>
          <div className="p-20">
            <EmptyState
              variant="card"
              title="No Tier Costs"
              message="Create your first tier cost to get started."
            />
          </div>
        </ArcadeCard>
      )}

      {/* Info Card */}
      <ArcadeCard className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          How Tier Costs Work
        </h3>
        <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>
            <strong>Tier costs</strong> determine how many credits are deducted
            when a user generates a game using a model of that tier.
          </p>
          <p>
            <strong>Score multiplier</strong> affects how many points players
            earn when playing games of this tier.
          </p>
          <p>
            <strong>Display order</strong> controls the order in which tiers
            appear in the UI (lower = first).
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1">
            <li>Changes take effect immediately for new generations</li>
            <li>Existing games are not affected</li>
            <li>
              Deleting a tier cost soft-deletes it (can be restored in DB)
            </li>
          </ul>
        </div>
      </ArcadeCard>

      {/* Edit Tier Cost Dialog */}
      <Dialog
        open={!!editingTierCost}
        onOpenChange={(open) => !open && setEditingTierCost(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tier Cost</DialogTitle>
            <DialogDescription>
              Update tier cost configuration
            </DialogDescription>
          </DialogHeader>
          {editingTierCost && (
            <TierCostForm mode="edit" tierCost={editingTierCost} />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Tier Cost Dialog */}
      <Dialog open={addingTierCost} onOpenChange={setAddingTierCost}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Tier Cost</DialogTitle>
            <DialogDescription>
              Configure a new tier cost for the platform
            </DialogDescription>
          </DialogHeader>
          <TierCostForm mode="add" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
