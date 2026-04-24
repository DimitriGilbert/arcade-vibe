"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormedible } from "@/hooks/use-formedible";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, Play, Key, Plus, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { trpcClient } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import type { Visibility, ModelSelection, IDESelection } from "./types";
import { DEFAULT_MAX_MODELS } from "@/lib/model-types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArcadeButton } from "@/components/arcade";
import { GuidanceBubble } from "./creator-guidance";
import type { CreatorGuidanceState } from "./creator-guidance";

interface ConfigPanelProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  width: number;
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
  gameName: string;
  setGameName: (name: string) => void;
  selectedModels: ModelSelection[];
  onModelToggle: (model: ModelSelection) => void;
  onModelRemove: (modelId: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  credits?: { balance: number };
  versions?: Array<{ id: string; version: number; createdAt: string }>;
  onSelectVersion?: (versionId: string) => void;
  selection: IDESelection;
  guidance: CreatorGuidanceState | null;
  onDismissGuidance: () => void;
  maxModels?: number;
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

export function ConfigPanel({
  collapsed,
  onCollapse,
  width,
  visibility,
  onVisibilityChange,
  gameName,
  setGameName,
  selectedModels,
  onModelToggle,
  onModelRemove,
  isGenerating,
  canGenerate,
  onGenerate,
  credits,
  versions,
  onSelectVersion,
  selection,
  guidance,
  onDismissGuidance,
  maxModels = DEFAULT_MAX_MODELS,
}: ConfigPanelProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const idCounterRef = useRef(0);

  const { data: modelMetadata, isLoading: modelsLoading } = useQuery({
    queryKey: ["modelMetadata"],
    queryFn: async () => {
      const result = await trpcClient.models.getModelMetadata.query();
      return {
        models: result.models,
        tierCosts: result.tierCosts,
        providers: result.providers,
        tiers: result.tiers,
      };
    },
  });

  const { data: apiKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
  });

  const tierOptions = modelMetadata?.tiers
    .filter((t) => modelMetadata.tierCosts[t])
    .map((tier) => ({
      value: tier,
      label: `${tier} (${modelMetadata.tierCosts[tier]}cr)`,
    })) ?? [];

  const providerOptions = modelMetadata?.providers.map((p) => ({
    value: p,
    label: p,
  })) ?? [];

  const apiKeyOptions = (() => {
    const noneOption = { value: "", label: "Platform credits" };
    const keys = apiKeys?.filter((k) => k.isActive) ?? [];
    if (keys.length === 0) return [noneOption];
    return [
      noneOption,
      ...keys.map((k) => ({ value: k.id, label: `${k.name} (${k.provider})` })),
    ];
  })();

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
        const alreadySelected = selectedModels.some((sm) => sm.modelKey === m.modelName);
        return {
          value: m.modelName,
          label: `${m.modelName} (${m.tier}, ${costLabel})${alreadySelected ? " ✓" : ""}`,
          disabled: alreadySelected,
        };
      });
    },
    [modelMetadata, selectedModels]
  );

  const { Form, form } = useFormedible<ModelSelectionValues>({
    schema: modelSelectionSchema,
    layout: { type: "grid", columns: 2, gap: "4" },
    fields: [
      {
        name: "tierFilter",
        type: "multiSelect",
        label: "Tier",
        section: { title: "" },
        options: tierOptions,
        conditional: () => showAdvancedOptions,
        multiSelectConfig: { placeholder: "All tiers", searchable: false },
      },
      {
        name: "providerFilter",
        type: "multiSelect",
        label: "Provider",
        section: { title: "" },
        options: providerOptions,
        conditional: () => showAdvancedOptions,
        multiSelectConfig: { placeholder: "All providers", searchable: true },
      },
      {
        name: "selectedModel",
        type: "combobox",
        label: "Model",
        section: { title: "" },
        options: (values) => getFilteredModels(values as ModelSelectionValues),
        gridColumnSpan: 2,
        comboboxConfig: {
          searchable: true,
          placeholder: "Search models...",
          searchPlaceholder: "Type to search...",
          noOptionsText: "No models found",
          allowClear: true,
        },
      },
      {
        name: "selectedApiKeyId",
        type: "select",
        label: "API Key",
        section: { title: "" },
        options: apiKeyOptions,
        conditional: () => showAdvancedOptions,
        selectConfig: { placeholder: "Platform credits" },
      },
      {
        name: "reasoningEnabled",
        type: "switch",
        label: "Reasoning",
        section: { title: "" },
        conditional: () => showAdvancedOptions,
        description: "Enable thinking for supported models",
      },
      {
        name: "reasoningMaxTokens",
        type: "number",
        label: "Max Thinking Tokens",
        section: { title: "" },
        conditional: (values) => showAdvancedOptions && values.reasoningEnabled === true,
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
        if (selectedModels.some((m) => m.modelKey === value.selectedModel)) return;
        if (selectedModels.length >= maxModels) return;

        const modelData = modelMetadata.models.find((m) => m.modelName === value.selectedModel);
        if (!modelData) return;

        const creditCost = modelMetadata.tierCosts[modelData.tier] ?? 0;
        const isByok = value.selectedApiKeyId && value.selectedApiKeyId !== "";

        const newSelection: ModelSelection = {
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

        onModelToggle(newSelection);
        form.reset();
        setFormKey((k) => k + 1);
        setShowModelSelector(false);
      },
    },
  });

  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);
  return (
    <aside
      style={collapsed ? undefined : { width: `${width}px` }}
      className={cn(
        "h-full border-l border-[var(--border)] bg-[var(--card)] shrink-0 transition-all duration-300 overflow-hidden relative",
        collapsed ? "w-0" : ""
      )}
    >
      {!collapsed && (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Config</h3>
            <button
              type="button"
              onClick={() => onCollapse(true)}
              className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
              aria-label="Collapse panel"
            >
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <span className="text-sm font-medium mb-1.5 block text-[var(--foreground)]">
                  Prompt Visibility
                </span>
                <Select value={visibility} onValueChange={(v) => onVisibilityChange(v as Visibility)}>
                  <SelectTrigger className="w-full" aria-label="Prompt visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {versions && versions.length > 0 && onSelectVersion && (
                <>
                  <div className="border-t border-[var(--border)]" />
                  <div>
                    <span className="text-sm font-medium mb-1.5 block text-[var(--foreground)]">
                      Version History
                    </span>
                    <Select value="" onValueChange={(v) => v && onSelectVersion(v)}>
                      <SelectTrigger className="w-full" aria-label="Select version">
                        <SelectValue placeholder="Load version..." />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            v{v.version} - {new Date(v.createdAt).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="border-t border-[var(--border)]" />

              <div>
                <span className="text-sm font-medium mb-1.5 block text-[var(--foreground)]">
                  Models ({selectedModels.length}/{maxModels})
                </span>

                {selectedModels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--muted)] rounded text-xs"
                      >
                        <span>{model.modelName}</span>
                        <button
                          type="button"
                          onClick={() => onModelRemove(model.id)}
                          className="hover:text-[var(--destructive)] transition-colors"
                          aria-label={`Remove ${model.modelName}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedModels.length < maxModels && (
                  <div className="space-y-2">
                    <div className="relative flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModelSelector(!showModelSelector)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)]/50 transition-colors"
                        disabled={modelsLoading}
                      >
                        <Plus className="h-3 w-3" />
                        Add model
                      </button>
                      {guidance?.currentStep === "model" ? (
                        <div className="absolute left-0 top-full z-10 mt-2 max-w-52">
                          <GuidanceBubble
                            text="Add one model before generating."
                            onDismiss={onDismissGuidance}
                          />
                        </div>
                      ) : null}
                      {showModelSelector && (
                        <button
                          type="button"
                          onClick={() => setShowAdvancedOptions((current) => !current)}
                          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          disabled={modelsLoading}
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                          Advanced
                          {showAdvancedOptions ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {showModelSelector && (
                      <div className="mt-2">
                        {modelsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
                        ) : (
                          <Form key={formKey} className="space-y-2" />
                        )}
                      </div>
                    )}

                    {showModelSelector && showAdvancedOptions && apiKeyOptions.length === 1 && (
                      <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Key className="h-3 w-3" />
                        <span>Add API keys in Settings for BYOK</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)]" />

              <div>
                <label htmlFor="game-name-input" className="text-sm font-medium mb-1.5 block text-[var(--foreground)]">
                  Game Name
                </label>
                <Input
                  id="game-name-input"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Optional game name..."
                  className="w-full"
                  maxLength={100}
                />
              </div>

              <div className="relative">
                {guidance?.currentStep === "generate" ? (
                  <div className="absolute bottom-full left-0 z-10 mb-2 max-w-56">
                    <GuidanceBubble
                      text="Everything is ready. Generate now."
                      onDismiss={onDismissGuidance}
                    />
                  </div>
                ) : null}
                <ArcadeButton
                  variant="glow"
                  className="w-full"
                  onClick={onGenerate}
                  disabled={!canGenerate || isGenerating}
                >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Generate
                  </>
                )}
                </ArcadeButton>
              </div>

              <div className="border-t border-[var(--border)]" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Generation cost:</span>
                <span className="font-medium text-[var(--foreground)]">{totalCredits} credits</span>
              </div>

              {credits && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Balance:</span>
                  <span className="font-medium text-[var(--foreground)]">{credits.balance} credits</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {collapsed && (
        <button
          type="button"
          onClick={() => onCollapse(false)}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 p-2 bg-[var(--card)] border border-[var(--border)] rounded-l-md hover:bg-[var(--muted)] transition-colors"
          aria-label="Expand panel"
        >
          <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
      )}
    </aside>
  );
}
