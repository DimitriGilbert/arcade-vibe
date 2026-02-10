"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw, Sparkles } from "lucide-react";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeInput,
  ArcadeBadge,
} from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

type Tier =
  | "cheater"
  | "very_easy"
  | "easy"
  | "normal"
  | "hard"
  | "very_hard"
  | "impossible";

interface TierCost {
  tier: Tier;
  creditCost: number;
  description: string | null;
  isCustom: boolean;
}

const TIER_LABELS: Record<Tier, string> = {
  cheater: "Cheater (Easiest)",
  very_easy: "Very Easy",
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  very_hard: "Very Hard",
  impossible: "Impossible (Hardest)",
};

const TIER_COLORS: Record<Tier, string> = {
  cheater: "bg-green-500/20 text-green-400 border-green-500/30",
  very_easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  easy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  normal: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  very_hard: "bg-red-500/20 text-red-400 border-red-500/30",
  impossible: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function AdminTierCostsPage() {
  const queryClient = useQueryClient();
  const [editedCosts, setEditedCosts] = useState<Record<Tier, number>>(
    {} as Record<Tier, number>,
  );

  // Fetch tier costs
  const { data: tierCosts, isLoading } = useQuery({
    queryKey: ["admin-tier-costs"],
    queryFn: async () => {
      return (await trpcClient.admin.tierCosts.getTierCosts.query()) as TierCost[];
    },
  });

  // Update tier cost mutation
  const updateTierCostMutation = useMutation({
    mutationFn: async (input: { tier: Tier; creditCost: number }) => {
      return await trpcClient.admin.tierCosts.updateTierCost.mutate(input);
    },
    onSuccess: () => {
      toast.success("Tier cost updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-tier-costs"] });
      setEditedCosts({} as Record<Tier, number>);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update tier cost");
    },
  });

  // Reset tier cost mutation
  const resetTierCostMutation = useMutation({
    mutationFn: async (input: { tier: Tier }) => {
      return await trpcClient.admin.tierCosts.resetTierCost.mutate(input);
    },
    onSuccess: () => {
      toast.success("Tier cost reset to default!");
      queryClient.invalidateQueries({ queryKey: ["admin-tier-costs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset tier cost");
    },
  });

  // Initialize defaults mutation
  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.admin.tierCosts.initializeDefaults.mutate();
    },
    onSuccess: (data) => {
      toast.success(`Initialized ${data.initializedCount} tier costs!`);
      queryClient.invalidateQueries({ queryKey: ["admin-tier-costs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initialize defaults");
    },
  });

  const handleCostChange = (tier: Tier, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setEditedCosts((prev) => ({ ...prev, [tier]: numValue }));
    }
  };

  const handleSave = (tier: Tier) => {
    const newCost = editedCosts[tier];
    if (newCost && newCost > 0) {
      updateTierCostMutation.mutate({ tier, creditCost: newCost });
    }
  };

  const handleReset = (tier: Tier) => {
    resetTierCostMutation.mutate({ tier });
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
        <ArcadeButton
          variant="outline"
          onClick={() => initializeDefaultsMutation.mutate()}
          disabled={initializeDefaultsMutation.isPending}
        >
          <Sparkles className="h-4 w-4" />
          Initialize Defaults
        </ArcadeButton>
      </div>

      {/* Tier Costs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tierCosts?.map((tierCost) => {
          const editedCost = editedCosts[tierCost.tier];
          const displayCost = editedCost ?? tierCost.creditCost;
          const hasChanges =
            editedCost !== undefined && editedCost !== tierCost.creditCost;

          return (
            <ArcadeCard key={tierCost.tier} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <ArcadeBadge
                    text={TIER_LABELS[tierCost.tier]}
                    className={TIER_COLORS[tierCost.tier]}
                  />
                  {tierCost.isCustom && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Custom
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[var(--muted-foreground)]">
                    Credit Cost
                  </label>
                  <ArcadeInput
                    type="number"
                    min={1}
                    value={displayCost}
                    onChange={(e) =>
                      handleCostChange(tierCost.tier, e.target.value)
                    }
                    className={hasChanges ? "border-[var(--accent)]" : ""}
                  />
                </div>

                <div className="flex gap-2">
                  <ArcadeButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(tierCost.tier)}
                    disabled={!hasChanges || updateTierCostMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </ArcadeButton>
                  {tierCost.isCustom && (
                    <ArcadeButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleReset(tierCost.tier)}
                      disabled={resetTierCostMutation.isPending}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </ArcadeButton>
                  )}
                </div>
              </div>
            </ArcadeCard>
          );
        })}
      </div>

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
            <strong>Easier tiers</strong> (Cheater, Very Easy) use more capable
            models with larger context windows, so they cost more credits.
          </p>
          <p>
            <strong>Harder tiers</strong> (Very Hard, Impossible) use smaller,
            more constrained models, so they cost fewer credits.
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1">
            <li>Changes take effect immediately for new generations</li>
            <li>Existing games are not affected</li>
            <li>Reset returns the cost to the system default</li>
          </ul>
        </div>
      </ArcadeCard>
    </div>
  );
}
