"use client";

import { useState, useMemo, useCallback } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge } from "@/components/arcade";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { z } from "zod";

export interface ModelConfig {
  id: string;
  providers: string[];
  modelName: string;
  tier: string;
  tierName: string;
  maxTokens: number;
  supportsImages: boolean;
}

export interface TierCost {
  id: string;
  slug: string;
  name: string;
  creditCost: number;
  description: string | null;
  scoreMultiplier: number;
  displayOrder: number;
  colorClass: string | null;
}

export function toModelConfig(data: {
  id: string;
  providers: string[];
  modelName: string;
  tier: string;
  tierName: string;
  maxTokens: number;
  supportsImages: boolean;
}): ModelConfig {
  return data;
}

export interface ModelMetadata {
  models: ModelConfig[];
  tierCosts: Record<string, number>;
  tierCostsArray: TierCost[];
  providers: string[];
  tiers: string[];
}

export interface ModelSelectorProps {
  modelMetadata: ModelMetadata;
  selectedModel: string;
  onSelectModel: (modelName: string | null) => void;
  disabled?: boolean;
}

// Schema for the model selection form
const modelSelectionSchema = z.object({
  tierFilter: z.array(z.string()).optional(),
  providerFilter: z.array(z.string()).optional(),
  selectedModel: z.string().min(1, "Please select a model"),
});

type ModelSelectionValues = z.infer<typeof modelSelectionSchema>;

export function ModelSelector({
  modelMetadata,
  selectedModel,
  onSelectModel,
  disabled = false,
}: ModelSelectorProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Tier options with credit costs from database - NO HARDCODED VALUES
  const tierOptions = useMemo(() => {
    return modelMetadata.tiers
      .filter((tier) => modelMetadata.tierCosts[tier] !== undefined)
      .map((tier) => ({
        value: tier,
        label: `${tier} (${modelMetadata.tierCosts[tier]}cr)`,
      }));
  }, [modelMetadata]);

  // Provider options derived from models
  const providerOptions = useMemo(() => {
    return modelMetadata.providers.map((p) => ({
      value: p,
      label: p,
    }));
  }, [modelMetadata]);

  // Filtered model options based on selected filters
  const getFilteredModels = useCallback(
    (values: ModelSelectionValues) => {
      let filtered = modelMetadata.models;

      if (values.tierFilter && values.tierFilter.length > 0) {
        filtered = filtered.filter((m) => values.tierFilter!.includes(m.tier));
      }

      if (values.providerFilter && values.providerFilter.length > 0) {
        filtered = filtered.filter((m) =>
          m.providers.some((p) => values.providerFilter!.includes(p)),
        );
      }

      return filtered.map((m) => {
        const cost = modelMetadata.tierCosts[m.tier];
        const costLabel = cost !== undefined ? `${cost}cr` : "cost unknown";
        return {
          value: m.modelName,
          label: `${m.modelName} (${m.tier}, ${costLabel})`,
        };
      });
    },
    [modelMetadata],
  );

  // Find selected model data for display
  const selectedModelData = useMemo(() => {
    return modelMetadata.models.find((m) => m.modelName === selectedModel);
  }, [modelMetadata.models, selectedModel]);

  const creditCost = useMemo(() => {
    if (!selectedModelData) return 0;
    return modelMetadata.tierCosts[selectedModelData.tier] ?? 0;
  }, [selectedModelData, modelMetadata.tierCosts]);

  const { Form } = useFormedible<ModelSelectionValues>({
    schema: modelSelectionSchema,
    fields: [
      // Collapsible filter section
      {
        name: "tierFilter",
        type: "multiSelect",
        label: "Filter by Tier",
        options: tierOptions,
        conditional: () => showFilters,
        multiSelectConfig: {
          placeholder: "All tiers",
          searchable: false,
        },
      },
      {
        name: "providerFilter",
        type: "multiSelect",
        label: "Filter by Provider",
        options: providerOptions,
        conditional: () => showFilters,
        multiSelectConfig: {
          placeholder: "All providers",
          searchable: true,
        },
      },
      // Model selection - always visible
      {
        name: "selectedModel",
        type: "combobox",
        label: "Model",
        options: (values) => getFilteredModels(values as ModelSelectionValues),
        comboboxConfig: {
          searchable: true,
          placeholder: "Search models...",
          searchPlaceholder: "Type to search models...",
          noOptionsText: "No models found",
          allowClear: true,
        },
      },
    ],
    formOptions: {
      defaultValues: {
        tierFilter: [],
        providerFilter: [],
        selectedModel: selectedModel ?? "",
      },
      onSubmit: async ({ value }) => {
        onSelectModel(value.selectedModel);
      },
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Model</span>
        {creditCost > 0 && (
          <ArcadeBadge text={`${creditCost} credits`} variant="default" />
        )}
      </div>

      {/* Collapsible Filters Toggle */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        disabled={disabled}
      >
        <Filter className="h-4 w-4" />
        {showFilters ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>Filters</span>
        {(showFilters || disabled) && (
          <span className="text-xs text-[var(--muted-foreground)]">
            (tier, provider)
          </span>
        )}
      </button>

      {/* Form with filters and model selection */}
      <Form className="space-y-4" />

      {/* Selected model info */}
      {selectedModelData && (
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>Providers: {selectedModelData.providers.join(", ")}</span>
          <span>
            Max: {selectedModelData.maxTokens.toLocaleString()} tokens
          </span>
        </div>
      )}
    </div>
  );
}

// Get credit cost from database tier costs - NO HARDCODED DEFAULTS
export function getCreditCostByTier(
  tier: string,
  tierCosts: Record<string, number>,
): number {
  return tierCosts[tier] ?? 0;
}
