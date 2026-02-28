"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { Loader2, X, Key, Check, AlertCircle, Brain, Sparkles, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import type { ModelSelection, GenerationStatus } from "@/lib/model-types";
import { MAX_MODELS } from "@/lib/model-types";
import { useGenerationStatus } from "@/stores/generations-store";
import type { Visibility } from "@/lib/trpc-types";

interface PromptEditorProps {
  promptContent: string;
  onPromptContentChange: (content: string) => void;
  gameName: string;
  onGameNameChange: (name: string) => void;
  selectedModels: ModelSelection[];
  onAddModel: (model: ModelSelection) => void;
  onRemoveModel: (id: string) => void;
  visibility: Visibility;
  version: number;
  versions: Array<{ id: string; version: number; createdAt: string }> | undefined;
  onSelectVersion: (versionId: string) => void;
  canEdit: boolean;
}

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

function ModelChip({
  model,
  onRemove,
  disabled,
}: {
  model: ModelSelection;
  onRemove: () => void;
  disabled: boolean;
}) {
  const status = useGenerationStatus(model.id) ?? "idle";
  const isActive = status === "reasoning" || status === "generating";

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--muted)] rounded-md border border-[var(--border)] text-xs">
      <StatusIcon status={status} />
      <span className="truncate max-w-[120px]">{model.modelName}</span>
      {model.isByok ? (
        <ArcadeBadge text="BYOK" variant="neon" className="text-[9px] px-1" />
      ) : (
        <span className="text-[var(--muted-foreground)]">{model.creditCost}cr</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled || isActive}
        className="ml-1 p-0.5 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Remove ${model.modelName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function PromptEditor({
  promptContent,
  onPromptContentChange,
  gameName,
  onGameNameChange,
  selectedModels,
  onAddModel,
  onRemoveModel,
  visibility,
  version,
  versions,
  onSelectVersion,
  canEdit,
}: PromptEditorProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState("");
  const [reasoningEnabled, setReasoningEnabled] = useState(true);

  // Fetch model metadata
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

  // Fetch API keys for BYOK
  const { data: apiKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
  });

  // Filter models
  const filteredModels = modelMetadata?.models.filter((m) => {
    if (selectedTierFilter.length > 0 && !selectedTierFilter.includes(m.tier)) {
      return false;
    }
    if (selectedModels.some((sm) => sm.modelKey === m.modelName)) {
      return false;
    }
    return true;
  }) ?? [];

  const tierOptions = modelMetadata?.tiers.filter((t) => modelMetadata.tierCosts[t]) ?? [];
  const apiKeyOptions = apiKeys?.filter((k) => k.isActive) ?? [];

  const handleAddModel = useCallback(() => {
    if (!selectedModel || !modelMetadata) return;
    if (selectedModels.length >= MAX_MODELS) {
      toast.error(`Maximum ${MAX_MODELS} models allowed`);
      return;
    }

    const modelData = modelMetadata.models.find((m) => m.modelName === selectedModel);
    if (!modelData) return;

    const creditCost = modelMetadata.tierCosts[modelData.tier] ?? 0;
    const isByok = selectedApiKeyId !== "";

    const selection: ModelSelection = {
      id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      modelKey: selectedModel,
      modelName: selectedModel,
      tier: modelData.tier,
      tierName: modelData.tierName,
      creditCost: isByok ? 0 : creditCost,
      apiKeyId: isByok ? selectedApiKeyId : null,
      isByok,
      reasoningEnabled,
      reasoningMaxTokens: 2000,
    };

    onAddModel(selection);
    setSelectedModel("");
    setSelectedApiKeyId("");
  }, [selectedModel, selectedApiKeyId, reasoningEnabled, modelMetadata, selectedModels, onAddModel]);

  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header row with version and visibility */}
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
        <div className="text-xs text-[var(--muted-foreground)]">
          {selectedModels.length}/{MAX_MODELS} models • {totalCredits} credits
        </div>
      </div>

      {/* Model chips */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[var(--border)] shrink-0">
        {selectedModels.map((model) => (
          <ModelChip
            key={model.id}
            model={model}
            onRemove={() => onRemoveModel(model.id)}
            disabled={!canEdit}
          />
        ))}
      </div>

      {/* Model selector and game name row */}
      <div className="px-4 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-4">
          {/* Model selector column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                disabled={modelsLoading}
              >
                <Filter className="h-3 w-3" />
                {showFilters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span>Filters</span>
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tierOptions.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      setSelectedTierFilter((prev) =>
                        prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
                      );
                    }}
                    className={`px-2 py-1 text-xs rounded border ${
                      selectedTierFilter.includes(tier)
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                        : "bg-[var(--background)] border-[var(--border)]"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {modelsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
              ) : (
                <>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="flex-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1.5"
                    disabled={selectedModels.length >= MAX_MODELS}
                  >
                    <option value="">Select model...</option>
                    {filteredModels.map((m) => (
                      <option key={m.modelName} value={m.modelName}>
                        {m.modelName} ({m.tier}, {modelMetadata?.tierCosts[m.tier]}cr)
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedApiKeyId}
                    onChange={(e) => setSelectedApiKeyId(e.target.value)}
                    className="w-32 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1.5"
                  >
                    <option value="">Platform</option>
                    {apiKeyOptions.map((k) => (
                      <option key={k.id} value={k.id}>
                        BYOK: {k.name}
                      </option>
                    ))}
                  </select>

                  <ArcadeButton
                    size="sm"
                    onClick={handleAddModel}
                    disabled={!selectedModel || selectedModels.length >= MAX_MODELS}
                  >
                    Add
                  </ArcadeButton>
                </>
              )}
            </div>

            {apiKeyOptions.length === 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[var(--muted-foreground)]">
                <Key className="h-3 w-3" />
                <span>Add API keys in Settings for BYOK</span>
              </div>
            )}
          </div>

          {/* Game name column */}
          <div className="md:w-64 shrink-0">
            <label htmlFor="game-name-input" className="block text-xs text-[var(--muted-foreground)] mb-1">Game name</label>
            <input
              id="game-name-input"
              type="text"
              placeholder="Optional..."
              value={gameName}
              onChange={(e) => onGameNameChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              maxLength={100}
            />
          </div>
        </div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0 [&_.monaco-editor_.margin]:!pl-4 [&_.monaco-editor_.lines-content]:!pl-4">
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
  );
}
