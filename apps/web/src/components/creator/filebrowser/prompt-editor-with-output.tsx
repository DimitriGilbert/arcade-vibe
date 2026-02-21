"use client";

import { useState, useCallback, memo, useEffect, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { useFormedible } from "@/hooks/use-formedible";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { Loader2, X, Key, Check, AlertCircle, Brain, Sparkles, Filter, ChevronDown, ChevronRight, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection, GenerationStatus } from "@/components/editor/model-types";
import { useGenerationById, useGenerationStatus } from "@/stores/generations-store";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import type { Visibility } from "@/lib/trpc-types";

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

const MAX_MODELS = 4;

function StatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3 w-3 animate-pulse text-purple-400" />;
    case "generating":
      return <Sparkles className="h-3 w-3 animate-spin text-cyan-400" />;
    case "complete":
      return <Check className="h-3 w-3 text-green-400" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
}

const ModelChip = memo(function ModelChip({
  model,
  onRemove,
  disabled,
  isActive,
  onClick,
}: {
  model: ModelSelection;
  onRemove: () => void;
  disabled: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const status = useGenerationStatus(model.id) ?? "idle";
  const isActiveGeneration = status === "reasoning" || status === "generating";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-pointer transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15"
          : "border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50",
      ].join(" ")}
    >
      <StatusIcon status={status} />
      <span className="truncate max-w-[100px]">{model.modelName}</span>
      {model.isByok ? (
        <ArcadeBadge text="BYOK" variant="neon" className="text-[9px] px-1" />
      ) : (
        <span className="text-[var(--muted-foreground)]">{model.creditCost}cr</span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled || isActiveGeneration}
        className="ml-0.5 p-0.5 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Remove ${model.modelName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </button>
  );
});

const ModelOutputTab = memo(function ModelOutputTab({
  model,
  isActive,
  onClick,
}: {
  model: ModelSelection;
  isActive: boolean;
  onClick: () => void;
}) {
  const status = useGenerationStatus(model.id) ?? "idle";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15"
          : "border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50",
      ].join(" ")}
    >
      <StatusIcon status={status} />
      <span className="truncate max-w-[80px]">{model.modelName}</span>
    </button>
  );
});

const modelSelectionSchema = z.object({
  tierFilter: z.array(z.string()).optional(),
  providerFilter: z.array(z.string()).optional(),
  selectedModel: z.string().min(1, "Please select a model"),
  selectedApiKeyId: z.string().optional(),
  reasoningEnabled: z.boolean().default(true),
  reasoningMaxTokens: z.number().min(500).max(10000).default(2000),
});

type ModelSelectionValues = z.infer<typeof modelSelectionSchema>;

function OutputStatusCard({
  title,
  description,
  tone = "neutral",
  icon,
}: {
  title: string;
  description: string;
  tone?: "neutral" | "error";
  icon?: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-[var(--destructive)]/40 bg-[var(--destructive)]/10"
      : "border-[var(--border)] bg-[var(--muted)]/10";

  return (
    <div
      className={`h-full min-h-0 rounded-lg border ${toneClass} flex items-center justify-center p-4`}
    >
      <div className="max-w-sm text-center space-y-2">
        {icon ? <div className="mx-auto w-fit">{icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function WaitingState({ status }: { status: "reasoning" | "generating" }) {
  return (
    <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        {status === "reasoning" ? (
          <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
        ) : (
          <Sparkles className="h-5 w-5 text-cyan-400 animate-spin" />
        )}
        <span className="text-sm text-[var(--muted-foreground)]">
          {status === "reasoning" ? "Thinking..." : "Generating code..."}
        </span>
      </div>
    </div>
  );
}

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
  const idCounterRef = useRef(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const generation = useGenerationById(activeOutputTab);
  const currentModel = selectedModels.find((m) => m.id === activeOutputTab);
  const isStreaming = generation?.status === "reasoning" || generation?.status === "generating";
  const codeLength = generation?.code.length ?? 0;
  const reasoningLength = generation?.reasoning?.length ?? 0;

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
    fields: [
      {
        name: "tierFilter",
        type: "multiSelect",
        label: "Tier",
        options: tierOptions,
        conditional: () => showFilters,
        multiSelectConfig: { placeholder: "All tiers", searchable: false },
      },
      {
        name: "providerFilter",
        type: "multiSelect",
        label: "Provider",
        options: providerOptions,
        conditional: () => showFilters,
        multiSelectConfig: { placeholder: "All providers", searchable: true },
      },
      {
        name: "selectedModel",
        type: "combobox",
        label: "Model",
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
        options: apiKeyOptions,
        selectConfig: { placeholder: "Platform credits" },
      },
      {
        name: "reasoningEnabled",
        type: "switch",
        label: "Reasoning",
        description: "Enable thinking for supported models",
      },
      {
        name: "reasoningMaxTokens",
        type: "number",
        label: "Max Thinking Tokens",
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

  const getScrollElement = useCallback((): HTMLElement | null => {
    const root = panelRef.current;
    if (!root) return null;
    const scroller = root.querySelector(".streaming-code-viewer__scroll");
    return scroller instanceof HTMLElement ? scroller : null;
  }, []);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    const markUserScrollIntent = () => {
      userScrollIntentRef.current = true;
    };

    const onScroll = () => {
      const isNearBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 32;
      if (isAutoScrollingRef.current && userScrollIntentRef.current && !isNearBottom) {
        isAutoScrollingRef.current = false;
      }
      setShowScrollButton(!isNearBottom);
      if (isNearBottom) {
        userScrollIntentRef.current = false;
      }
    };

    scroller.addEventListener("wheel", markUserScrollIntent, { passive: true });
    scroller.addEventListener("touchstart", markUserScrollIntent, { passive: true });
    scroller.addEventListener("mousedown", markUserScrollIntent);
    scroller.addEventListener("scroll", onScroll);
    return () => {
      scroller.removeEventListener("wheel", markUserScrollIntent);
      scroller.removeEventListener("touchstart", markUserScrollIntent);
      scroller.removeEventListener("mousedown", markUserScrollIntent);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [getScrollElement]);

  useEffect(() => {
    if (isStreaming) {
      isAutoScrollingRef.current = true;
      setShowScrollButton(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    if (!isAutoScrollingRef.current) return;

    const scroller = getScrollElement();
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [isStreaming, getScrollElement]);

  const scrollToBottom = () => {
    const scroller = getScrollElement();
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    userScrollIntentRef.current = false;
    isAutoScrollingRef.current = true;
    setShowScrollButton(false);
  };

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
            onRemove={() => onRemoveModel(model.id)}
            disabled={!canEdit}
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

            {apiKeyOptions.length === 1 && showModelSelector && (
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
                    <ModelOutputTab
                      key={model.id}
                      model={model}
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
                <OutputStatusCard
                  tone="error"
                  icon={<AlertCircle className="h-6 w-6 text-[var(--destructive)]" />}
                  title="Generation failed"
                  description={generation.error ?? "An error occurred"}
                />
              ) : (
                <OutputStatusCard
                  title={currentModel ? `Ready: ${currentModel.modelName}` : "Ready"}
                  description="Click Generate to create your game"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
