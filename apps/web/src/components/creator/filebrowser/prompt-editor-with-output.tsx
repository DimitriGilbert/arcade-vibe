"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { Loader2, Key, AlertCircle, Filter, ChevronDown, ChevronRight, ArrowDown, Plus, Scale } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection, GenerationStatus } from "@/lib/model-types";
import { MAX_MODELS } from "@/lib/model-types";
import { useGenerationById, useGenerationStatus } from "@/stores/generations-store";
import { useAutoScroll } from "@/hooks/creator/use-auto-scroll";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import type { Visibility } from "@/lib/trpc-types";
import { ModelChip, ModelOutputTab, OutputStatusCard, WaitingState, VersionComparisonDialog } from "@/components/creator/shared";

function ModelOutputTabWithStatus({
  modelKey,
  modelName,
  isActive,
  onClick,
}: {
  modelKey: string;
  modelName: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const status = useGenerationStatus(modelKey) ?? "idle";
  return (
    <ModelOutputTab
      modelKey={modelKey}
      modelName={modelName}
      status={status}
      isActive={isActive}
      onClick={onClick}
    />
  );
}

interface PromptEditorWithOutputProps {
  promptContent: string;
  onPromptContentChange: (content: string) => void;
  gameName: string;
  onGameNameChange: (name: string) => void;
  selectedModels: ModelSelection[];
  onAddModel: (model: ModelSelection) => void;
  onRemoveModel: (id: string) => void;
  activeOutputTab: string | null;
  onOutputTabChange: (id: string) => void;
  visibility: Visibility;
  version: number;
  versions: Array<{ id: string; version: number; createdAt: string }> | undefined;
  onSelectVersion: (versionId: string) => void;
  canEdit: boolean;
  isGenerating: boolean;
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

export function PromptEditorWithOutput({
  promptContent,
  onPromptContentChange,
  gameName,
  onGameNameChange,
  selectedModels,
  onAddModel,
  onRemoveModel,
  activeOutputTab,
  onOutputTabChange,
  visibility,
  version,
  versions,
  onSelectVersion,
  canEdit,
  isGenerating,
}: PromptEditorWithOutputProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const idCounterRef = useRef(0);

  const panelRef = useRef<HTMLDivElement>(null);

  const generation = useGenerationById(activeOutputTab);
  const currentModel = selectedModels.find((m) => m.id === activeOutputTab);
  const isStreaming = generation?.status === "reasoning" || generation?.status === "generating";
  const { showScrollButton, scrollToBottom } = useAutoScroll(panelRef, isStreaming);

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
        conditional: () => showFilters,
        multiSelectConfig: { placeholder: "All tiers", searchable: false },
      },
      {
        name: "providerFilter",
        type: "multiSelect",
        label: "Provider",
        section: { title: "" },
        options: providerOptions,
        conditional: () => showFilters,
        multiSelectConfig: { placeholder: "All providers", searchable: true },
      },
      {
        name: "selectedModel",
        type: "combobox",
        label: "Model",
        section: { title: "" },
        options: (values) => getFilteredModels(values as ModelSelectionValues),
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
        selectConfig: { placeholder: "Platform credits" },
      },
      {
        name: "reasoningEnabled",
        type: "switch",
        label: "Reasoning",
        section: { title: "" },
        description: "Enable thinking for supported models",
      },
      {
        name: "reasoningMaxTokens",
        type: "number",
        label: "Max Thinking Tokens",
        section: { title: "" },
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
        if (selectedModels.some((m) => m.modelKey === value.selectedModel)) return;
        if (selectedModels.length >= MAX_MODELS) return;

        const modelData = modelMetadata.models.find((m) => m.modelName === value.selectedModel);
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
        setShowModelSelector(false);
      },
    },
  });

  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);
  const hasOutput = generation?.code || generation?.reasoning;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <ArcadeBadge text={`v${version}`} variant="neon" />
          <ArcadeBadge text={visibility} variant="default" />
          {versions && versions.length > 1 && (
            <>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onSelectVersion(e.target.value);
                }}
                className="text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1"
              >
                <option value="">Load version...</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version} - {new Date(v.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={() => setCompareDialogOpen(true)}
                className="h-6 px-2"
              >
                <Scale className="h-3 w-3" />
              </ArcadeButton>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            {selectedModels.length}/{MAX_MODELS} models • {totalCredits}cr
          </span>
          {isGenerating && (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
          )}
        </div>
      </div>

      {/* Model chips row */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[var(--border)] shrink-0">
        {selectedModels.map((model) => (
          <ModelChip
            key={model.id}
            model={model}
            onRemove={canEdit ? () => onRemoveModel(model.id) : undefined}
            isActive={model.id === activeOutputTab}
            onClick={() => onOutputTabChange(model.id)}
          />
        ))}
      </div>

      {/* Main content: Editor + Output */}
      <div className="flex-1 min-h-0 flex gap-0 overflow-hidden">
        {/* Editor side */}
        <div className={`${hasOutput || isGenerating ? "w-1/2" : "flex-1"} min-h-0 flex flex-col border-r border-[var(--border)]`}>
          {/* Model selector */}
          <div className="px-4 py-2 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2">
              {selectedModels.length < MAX_MODELS && (
                <button
                  type="button"
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)]/50 transition-colors"
                  disabled={modelsLoading || !canEdit}
                >
                  <Plus className="h-3 w-3" />
                  Add model
                </button>
              )}
              {showModelSelector && (
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  disabled={modelsLoading}
                >
                  <Filter className="h-3 w-3" />
                  {showFilters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span>Filters</span>
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

            {showModelSelector && showFilters && apiKeyOptions.length === 1 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[var(--muted-foreground)]">
                <Key className="h-3 w-3" />
                <span>Add API keys in Settings for BYOK</span>
              </div>
            )}
          </div>

          {/* Game name */}
          <div className="px-4 py-2 border-b border-[var(--border)] shrink-0">
            <input
              type="text"
              placeholder="Game name (optional)"
              value={gameName}
              onChange={(e) => onGameNameChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              maxLength={100}
            />
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={promptContent}
              onChange={(value) => onPromptContentChange(value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                lineNumbers: "on",
                wordWrap: "on",
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                readOnly: !canEdit,
              }}
            />
          </div>
        </div>

        {/* Output side */}
        {(hasOutput || isGenerating) && (
          <div className="w-1/2 min-h-0 flex flex-col overflow-hidden">
            {/* Output header with model tabs */}
            {selectedModels.length > 1 && (
              <div className="shrink-0 p-2 border-b border-[var(--border)] bg-[var(--card)]">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {selectedModels.map((model) => (
                    <ModelOutputTabWithStatus
                      key={model.id}
                      modelKey={model.id}
                      modelName={model.modelName}
                      isActive={model.id === activeOutputTab}
                      onClick={() => onOutputTabChange(model.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Output content */}
            <div className="flex-1 min-h-0 overflow-hidden relative" ref={panelRef}>
              {hasOutput ? (
                <div className="h-full min-h-0 overflow-hidden relative p-1.5">
                  <StreamingCodeViewerV2
                    key={activeOutputTab ?? "no-active"}
                    code={generation?.code ?? ""}
                    reasoning={generation?.reasoning}
                    language="html"
                    isStreaming={isStreaming}
                    fileName="game.html"
                  />
                  {showScrollButton && isStreaming && (
                    <ArcadeButton
                      variant="outline"
                      size="sm"
                      onClick={scrollToBottom}
                      className="absolute bottom-3 right-3 shadow-md"
                    >
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Follow
                    </ArcadeButton>
                  )}
                </div>
              ) : generation?.status === "reasoning" ? (
                <WaitingState status="reasoning" />
              ) : generation?.status === "generating" ? (
                <WaitingState status="generating" />
              ) : generation?.status === "error" ? (
                <OutputStatusCard type="error" error={generation.error ?? "An error occurred"} />
              ) : (
                <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-center p-4">
                  <div className="max-w-sm text-center space-y-2">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {currentModel ? `Ready: ${currentModel.modelName}` : "Ready"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Click Generate to create your game
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {versions && versions.length > 1 && (
        <VersionComparisonDialog
          open={compareDialogOpen}
          onOpenChange={setCompareDialogOpen}
          versions={versions}
          currentVersion={version}
          getContent={() => promptContent}
        />
      )}
    </div>
  );
}
