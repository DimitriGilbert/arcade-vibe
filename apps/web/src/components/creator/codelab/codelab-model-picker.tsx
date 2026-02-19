"use client";

import { useState, useMemo, useRef } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge } from "@/components/arcade";
import { ChevronDown, ChevronRight, Filter, Key, X, Brain, Sparkles, Check, AlertCircle } from "lucide-react";
import { z } from "zod";
import type { CodelabModelSelection, CodelabModelMetadata, CodelabApiKey } from "./types";
import type { GenerationStatus } from "@/components/editor/model-types";

const MAX_MODELS = 4;

const modelSelectionSchema = z.object({
  tierFilter: z.array(z.string()).optional(),
  providerFilter: z.array(z.string()).optional(),
  selectedModel: z.string().min(1, "Please select a model"),
  selectedApiKeyId: z.string().optional(),
  reasoningEnabled: z.boolean().default(true),
  reasoningMaxTokens: z.number().min(500).max(10000).default(2000),
});

type ModelSelectionValues = z.infer<typeof modelSelectionSchema>;

function StatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3 w-3 animate-pulse text-purple-400" />;
    case "generating":
      return <Sparkles className="h-3 w-3 animate-spin text-blue-400" />;
    case "complete":
      return <Check className="h-3 w-3 text-green-400" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
}

function getModelStatus(
  modelId: string,
  generatingModels: Set<string>
): GenerationStatus {
  if (generatingModels.has(modelId)) return "generating";
  return "idle";
}

interface CodelabModelPickerProps {
  modelMetadata: CodelabModelMetadata;
  selectedModels: CodelabModelSelection[];
  onAddModel: (selection: CodelabModelSelection) => void;
  onRemoveModel: (id: string) => void;
  apiKeys?: CodelabApiKey[];
  disabled?: boolean;
  generatingModels?: Set<string>;
}

export function CodelabModelPicker({
  modelMetadata,
  selectedModels,
  onAddModel,
  onRemoveModel,
  apiKeys = [],
  disabled = false,
  generatingModels = new Set(),
}: CodelabModelPickerProps) {
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

  const existingModelKeys = useMemo(
    () => selectedModels.map((m) => m.modelKey),
    [selectedModels]
  );

  const getFilteredModels = (values: ModelSelectionValues) => {
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
      const costLabel = cost !== undefined ? `${cost}cr` : "cost unknown";
      const alreadySelected = existingModelKeys.includes(m.modelName);
      return {
        value: m.modelName,
        label: `${m.modelName} (${m.tier}, ${costLabel})${alreadySelected ? " ✓" : ""}`,
        disabled: alreadySelected,
      };
    });
  };

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
        description: "Enable reasoning for supported models",
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
          (m) => m.modelName === value.selectedModel
        );
        if (!modelData) return;

        const creditCost = modelMetadata.tierCosts[modelData.tier] ?? 0;
        const isByok = value.selectedApiKeyId && value.selectedApiKeyId !== "";

        const selection: CodelabModelSelection = {
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

  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);
  const hasByok = selectedModels.some((m) => m.isByok);

  return (
    <div className="space-y-3">
      {/* Selected Models List */}
      {selectedModels.length > 0 && (
        <div className="space-y-1.5">
          {selectedModels.map((model) => {
            const status = getModelStatus(model.id, generatingModels);
            const isActive = status === "reasoning" || status === "generating";

            return (
              <div
                key={model.id}
                className="flex items-center gap-2 p-2 bg-[var(--background)] border border-[var(--border)] rounded-md"
              >
                <StatusIcon status={status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">
                      {model.modelName}
                    </span>
                    {model.isByok ? (
                      <ArcadeBadge text="BYOK" variant="neon" className="shrink-0 text-[10px] px-1" />
                    ) : (
                      <ArcadeBadge
                        text={`${model.creditCost}cr`}
                        variant="default"
                        className="shrink-0 text-[10px] px-1"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {model.tierName}
                  </span>
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
          })}
          <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Total:
            </span>
            <div className="flex items-center gap-1">
              {hasByok && (
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  (+ BYOK)
                </span>
              )}
              <ArcadeBadge text={`${totalCredits}cr`} variant="neon" className="text-[10px] px-1" />
            </div>
          </div>
        </div>
      )}

      {/* Add Model Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Add Model</span>
          <ArcadeBadge
            text={`${selectedModels.length}/${MAX_MODELS}`}
            variant={selectedModels.length >= MAX_MODELS ? "neon" : "default"}
            className="text-[10px] px-1"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          disabled={disabled || selectedModels.length >= MAX_MODELS}
        >
          <Filter className="h-3 w-3" />
          {showFilters ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>Filters</span>
        </button>

        <Form key={formKey} className="space-y-2" />

        {apiKeys.length === 0 && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
            <Key className="h-3 w-3" />
            <span>Add API keys in Settings for BYOK</span>
          </div>
        )}
      </div>
    </div>
  );
}
