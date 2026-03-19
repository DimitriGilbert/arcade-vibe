"use client";

import { useState, useMemo, useCallback, useRef, memo } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge } from "@/components/arcade";
import { ChevronDown, ChevronRight, Filter, Key, X } from "lucide-react";
import { z } from "zod";
import type { GenerationStatus } from "./types";
import { MAX_MODELS, type ModelSelection, type ModelMetadata, type ApiKey } from "./types";
import { useGenerationStatus } from "@/stores/generations-store";
import { StatusIcon } from "@/components/creator/shared";

interface SelectedModelsListProps {
  models: ModelSelection[];
  onRemoveModel: (id: string) => void;
  disabled?: boolean;
}

const ModelItem = memo(function ModelItem({
  model,
  onRemoveModel,
  disabled,
}: {
  model: ModelSelection;
  onRemoveModel: (id: string) => void;
  disabled: boolean;
}) {
  const status = useGenerationStatus(model.id) ?? "idle";
  const isActive = status === "reasoning" || status === "generating";

  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--card)] border border-[var(--border)] rounded-md">
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">{model.modelName}</span>
          {model.isByok ? (
            <ArcadeBadge text="BYOK" variant="neon" className="shrink-0 text-[10px] px-1.5" />
          ) : (
            <ArcadeBadge text={`${model.creditCost}cr`} variant="neon" className="shrink-0 text-[10px] px-1.5" />
          )}
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)]">{model.tierName}</span>
      </div>
      <button
        type="button"
        onClick={() => onRemoveModel(model.id)}
        disabled={disabled || isActive}
        className="p-1 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Remove ${model.modelName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});

function SelectedModelsList({ models, onRemoveModel, disabled = false }: SelectedModelsListProps) {
  if (models.length === 0) {
    return (
      <div className="text-xs text-[var(--muted-foreground)] text-center py-3 border border-dashed border-[var(--border)] rounded-md">
        No models selected
      </div>
    );
  }

  const totalCredits = models.reduce((sum, m) => sum + m.creditCost, 0);
  const hasByok = models.some((m) => m.isByok);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {models.map((model) => (
          <ModelItem
            key={model.id}
            model={model}
            onRemoveModel={onRemoveModel}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted-foreground)]">Total:</span>
        <div className="flex items-center gap-1.5">
          {hasByok && <span className="text-[10px] text-[var(--muted-foreground)]">(+ BYOK)</span>}
          <ArcadeBadge text={`${totalCredits}cr`} variant="neon" className="text-[10px]" />
        </div>
      </div>
    </div>
  );
}

const modelSelectionSchema = z.object({
  tierFilter: z.array(z.string()).optional(),
  providerFilter: z.array(z.string()).optional(),
  selectedModel: z.string().min(1, "Select a model"),
  selectedApiKeyId: z.string().optional(),
  reasoningEnabled: z.boolean().default(true),
  reasoningMaxTokens: z.number().min(500).max(10000).default(2000),
});

type ModelSelectionValues = z.infer<typeof modelSelectionSchema>;

interface WorkbenchModelsTabProps {
  modelMetadata: ModelMetadata | null | undefined;
  selectedModels: ModelSelection[];
  onAddModel: (selection: ModelSelection) => void;
  onRemoveModel: (id: string) => void;
  apiKeys: ApiKey[] | undefined;
  disabled?: boolean;
}

export function WorkbenchModelsTab({
  modelMetadata,
  selectedModels,
  onAddModel,
  onRemoveModel,
  apiKeys = [],
  disabled = false,
}: WorkbenchModelsTabProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const idCounterRef = useRef(0);

  const tierOptions = useMemo(() => {
    if (!modelMetadata) return [];
    return modelMetadata.tiers
      .filter((tier) => modelMetadata.tierCosts[tier] !== undefined)
      .map((tier) => ({
        value: tier,
        label: `${tier} (${modelMetadata.tierCosts[tier]}cr)`,
      }));
  }, [modelMetadata]);

  const providerOptions = useMemo(() => {
    if (!modelMetadata) return [];
    return modelMetadata.providers.map((p) => ({
      value: p,
      label: p,
    }));
  }, [modelMetadata]);

  const apiKeyOptions = useMemo(() => {
    const noneOption = { value: "", label: "Platform credits" };
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

  const existingModelKeys = useMemo(
    () => selectedModels.map((m) => m.modelKey),
    [selectedModels]
  );

  const getFilteredModels = useCallback(
    (values: ModelSelectionValues) => {
      if (!modelMetadata) return [];
      let filtered = modelMetadata.models;

      if (values.tierFilter && values.tierFilter.length > 0) {
        filtered = filtered.filter((m) => values.tierFilter!.includes(m.tier));
      }

      if (values.providerFilter && values.providerFilter.length > 0) {
        filtered = filtered.filter((m) =>
          m.providers.some((p) => values.providerFilter!.includes(p))
        );
      }

      return filtered.map((m) => {
        const cost = modelMetadata.tierCosts[m.tier];
        const costLabel = cost !== undefined ? `${cost}cr` : "?";
        const alreadySelected = existingModelKeys.includes(m.modelName);
        return {
          value: m.modelName,
          label: `${m.modelName} (${m.tier}, ${costLabel})${alreadySelected ? " ✓" : ""}`,
          disabled: alreadySelected,
        };
      });
    },
    [modelMetadata, existingModelKeys]
  );

  const { Form, form } = useFormedible<ModelSelectionValues>({
    schema: modelSelectionSchema,
    fields: [
      {
        name: "tierFilter",
        type: "multiSelect",
        label: "Tier",
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
        label: "Provider",
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
          placeholder: "Search...",
          searchPlaceholder: "Type to search...",
          noOptionsText: "No models",
          allowClear: true,
        },
      },
      {
        name: "selectedApiKeyId",
        type: "select",
        label: "API Key",
        options: apiKeyOptions,
        selectConfig: {
          placeholder: "Platform credits",
        },
      },
      {
        name: "reasoningEnabled",
        type: "switch",
        label: "Reasoning",
        description: "Enable thinking",
      },
      {
        name: "reasoningMaxTokens",
        type: "number",
        label: "Max Tokens",
        conditional: (values) => values.reasoningEnabled === true,
        min: 500,
        max: 10000,
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
        if (!modelMetadata) return;
        if (existingModelKeys.includes(value.selectedModel)) return;
        if (existingModelKeys.length >= MAX_MODELS) return;

        const modelData = modelMetadata.models.find(
          (m) => m.modelName === value.selectedModel
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

  if (!modelMetadata) {
    return (
      <div className="flex items-center justify-center h-20">
        <span className="text-xs text-[var(--muted-foreground)]">Loading models...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected Models */}
      <SelectedModelsList
        models={selectedModels}
        onRemoveModel={onRemoveModel}
        disabled={disabled}
      />

      {/* Add Model Section */}
      <div className="pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">Add Model</span>
          <ArcadeBadge text={`${selectedModels.length}/${MAX_MODELS}`} variant="neon" className="text-[10px]" />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-2"
          disabled={disabled}
        >
          <Filter className="h-3 w-3" />
          {showFilters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span>Filters</span>
        </button>

        <Form key={formKey} className="space-y-3" />

        {showFilters && apiKeys.length === 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] mt-2">
            <Key className="h-3 w-3" />
            <span>Add API keys in Settings for BYOK</span>
          </div>
        )}
      </div>
    </div>
  );
}
