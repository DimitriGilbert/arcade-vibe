"use client";

import { useState, useMemo, useRef } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { ChevronDown, ChevronRight, Filter, Key } from "lucide-react";
import { z } from "zod";
import type { ModelSelection, ModelMetadata, ApiKey } from "./inbox-types";
import { MAX_MODELS, generateModelSelectionId } from "./inbox-types";

export interface InboxModelSelectorProps {
  modelMetadata: ModelMetadata;
  existingModelKeys: string[];
  onAddModel: (selection: ModelSelection) => void;
  apiKeys?: ApiKey[];
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

export function InboxModelSelector({
  modelMetadata,
  existingModelKeys,
  onAddModel,
  apiKeys = [],
  disabled = false,
}: InboxModelSelectorProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const idCounterRef = useRef(0);

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

  const getFilteredModels = useMemo(() => {
    return (values: ModelSelectionValues) => {
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
        const alreadySelected = existingModelKeys.includes(m.modelName);
        return {
          value: m.modelName,
          label: `${m.modelName} (${m.tier}, ${costLabel})${alreadySelected ? " ✓" : ""}`,
          disabled: alreadySelected,
        };
      });
    };
  }, [modelMetadata, existingModelKeys]);

  const { Form, form } = useFormedible<ModelSelectionValues>({
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
        selectedModel: "",
        selectedApiKeyId: "",
        reasoningEnabled: true,
        reasoningMaxTokens: 2000,
      },
      onSubmit: async ({ value }) => {
        if (existingModelKeys.includes(value.selectedModel)) {
          return;
        }

        if (existingModelKeys.length >= MAX_MODELS) {
          return;
        }

        const modelData = modelMetadata.models.find(
          (m) => m.modelName === value.selectedModel,
        );
        if (!modelData) return;

        const creditCost = modelMetadata.tierCosts[modelData.tier] ?? 0;
        const isByok = value.selectedApiKeyId && value.selectedApiKeyId !== "";

        const selection: ModelSelection = {
          id: `model-${Date.now()}-${idCounterRef.current++}`,
          modelKey: value.selectedModel,
          modelName: value.selectedModel,
          tier: modelData.tier,
          tierName: modelData.tierName,
          creditCost: isByok ? 0 : creditCost,
          apiKeyId: isByok ? (value.selectedApiKeyId ?? null) : null,
          isByok: !!isByok,
          reasoningEnabled: value.reasoningEnabled,
          reasoningMaxTokens: value.reasoningMaxTokens,
        };

        onAddModel(selection);
        form.reset();
        setFormKey((k) => k + 1);
      },
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Add Model</span>
        <ArcadeBadge
          text={`${existingModelKeys.length}/${MAX_MODELS}`}
          variant="neon"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        disabled={disabled}
      >
        <Filter className="h-3 w-3" />
        {showFilters ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span>Filters</span>
      </button>

      <Form key={formKey} className="space-y-3" />

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
