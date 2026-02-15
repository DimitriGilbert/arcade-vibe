"use client";

import { useState, useMemo, useCallback } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge } from "@/components/arcade";
import { ChevronDown, ChevronRight, Filter, Key } from "lucide-react";
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

export interface ApiKey {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
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
  apiKeys?: ApiKey[];
  selectedApiKeyId: string | null;
  onSelectApiKey: (apiKeyId: string | null) => void;
  reasoningEnabled: boolean;
  reasoningMaxTokens: number;
  onReasoningChange: (enabled: boolean) => void;
  onReasoningMaxTokensChange: (maxTokens: number) => void;
  disabled?: boolean;
}

const modelSelectionSchema = z.object({
  tierFilter: z.array(z.string()).optional(),
  providerFilter: z.array(z.string()).optional(),
  selectedModel: z.string().min(1, "Please select a model"),
  selectedApiKeyId: z.string().optional(),
  reasoningEnabled: z.boolean().default(true),
  reasoningMaxTokens: z.number().min(500).max(10000).default(2000),
});

type ModelSelectionValues = z.infer<typeof modelSelectionSchema>;

export function ModelSelector({
  modelMetadata,
  selectedModel,
  onSelectModel,
  apiKeys = [],
  selectedApiKeyId,
  onSelectApiKey,
  reasoningEnabled,
  reasoningMaxTokens,
  onReasoningChange,
  onReasoningMaxTokensChange,
  disabled = false,
}: ModelSelectorProps) {
  const [showFilters, setShowFilters] = useState(false);

  const tierOptions = useMemo(() => {
    return modelMetadata.tiers
      .filter((tier) => modelMetadata.tierCosts[tier] !== undefined)
      .map((tier) => ({
        value: tier,
        label: `${tier} (${modelMetadata.tierCosts[tier]}cr)`,
      }));
  }, [modelMetadata]);

  const providerOptions = useMemo(() => {
    return modelMetadata.providers.map((p) => ({
      value: p,
      label: p,
    }));
  }, [modelMetadata]);

  const apiKeyOptions = useMemo(() => {
    const noneOption = { value: "", label: "Use platform credits" };
    if (!apiKeys || apiKeys.length === 0) {
      return [noneOption];
    }
    const keyOptions = apiKeys
      .filter((k) => k.isActive)
      .map((k) => ({
        value: k.id,
        label: `${k.name} (${k.provider})`,
      }));
    return [noneOption, ...keyOptions];
  }, [apiKeys]);

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

  const selectedModelData = useMemo(() => {
    return modelMetadata.models.find((m) => m.modelName === selectedModel);
  }, [modelMetadata.models, selectedModel]);

  const creditCost = useMemo(() => {
    if (!selectedModelData) return 0;
    return modelMetadata.tierCosts[selectedModelData.tier] ?? 0;
  }, [selectedModelData, modelMetadata.tierCosts]);

  const isByok = useMemo(() => {
    return selectedApiKeyId !== null && selectedApiKeyId !== "";
  }, [selectedApiKeyId]);

  const { Form } = useFormedible<ModelSelectionValues>({
    schema: modelSelectionSchema,
    fields: [
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
      {
        name: "selectedApiKeyId",
        type: "select",
        label: "API Key (BYOK)",
        options: apiKeyOptions,
        selectConfig: {
          placeholder: "Use platform credits",
        },
      },
      {
        name: "reasoningEnabled",
        type: "switch",
        label: "Reasoning",
        description: "Enable reasoning/thinking for supported models",
      },
      {
        name: "reasoningMaxTokens",
        type: "number",
        label: "Max Reasoning Tokens",
        conditional: (values) => values.reasoningEnabled === true,
        min: 500,
        max: 10000,
        description: "Maximum tokens for reasoning (500-10000)",
      },
    ],
    formOptions: {
      defaultValues: {
        tierFilter: [],
        providerFilter: [],
        selectedModel: selectedModel ?? "",
        selectedApiKeyId: selectedApiKeyId ?? "",
        reasoningEnabled: reasoningEnabled,
        reasoningMaxTokens: reasoningMaxTokens,
      },
      onSubmit: async ({ value }) => {
        onSelectModel(value.selectedModel);
        onSelectApiKey(value.selectedApiKeyId || null);
        onReasoningChange(value.reasoningEnabled);
        onReasoningMaxTokensChange(value.reasoningMaxTokens);
      },
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Model</span>
        {isByok ? (
          <ArcadeBadge text="BYOK" variant="neon" />
        ) : selectedModel ? (
          <ArcadeBadge text={`${creditCost} credits`} variant="neon" />
        ) : (
          <ArcadeBadge text="Select model" variant="neon" />
        )}
      </div>

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

      <Form className="space-y-4" />

      {selectedModelData && (
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>Providers: {selectedModelData.providers.join(", ")}</span>
          <span>
            Max: {selectedModelData.maxTokens.toLocaleString()} tokens
          </span>
        </div>
      )}

      {apiKeys.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Key className="h-3 w-3" />
          <span>Add API keys in Settings for BYOK</span>
        </div>
      )}
    </div>
  );
}

export function getCreditCostByTier(
  tier: string,
  tierCosts: Record<string, number>,
): number {
  return tierCosts[tier] ?? 0;
}
