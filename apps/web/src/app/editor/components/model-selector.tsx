"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";

export type ModelTier = "cheater" | "easy" | "normal" | "hard" | "impossible";

export interface ModelConfig {
  id: string;
  provider: string;
  modelName: string;
  tier: ModelTier;
  maxTokens: number;
  supportsImages: boolean;
}

// Type guard to validate tier value from API
export function isValidTier(tier: string): tier is ModelTier {
  return ["cheater", "easy", "normal", "hard", "impossible"].includes(tier);
}

// Convert API response to ModelConfig with proper tier typing
export function toModelConfig(data: {
  id: string;
  provider: string;
  modelName: string;
  tier: string;
  maxTokens: number;
  supportsImages: boolean;
}): ModelConfig {
  return {
    ...data,
    tier: isValidTier(data.tier) ? data.tier : "normal",
  };
}

export interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: string;
  onSelectModel: (modelName: string | null) => void;
  disabled?: boolean;
  showTierBadge?: boolean;
}

// Tier badge colors
const tierBadgeColors: Record<string, { bg: string; text: string }> = {
  cheater: { bg: "bg-purple-100", text: "text-purple-800" },
  easy: { bg: "bg-blue-100", text: "text-blue-800" },
  normal: { bg: "bg-green-100", text: "text-green-800" },
  hard: { bg: "bg-orange-100", text: "text-orange-800" },
  impossible: { bg: "bg-red-100", text: "text-red-800" },
};

// Credit costs by tier
const creditCosts: Record<string, number> = {
  cheater: 20,
  easy: 12,
  normal: 8,
  hard: 5,
  impossible: 2,
};

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  disabled = false,
  showTierBadge = true,
}: ModelSelectorProps) {
  const selectedModelData = models.find((m) => m.modelName === selectedModel);
  const creditCost = selectedModelData ? creditCosts[selectedModelData.tier] : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Model</span>
        {creditCost > 0 && (
          <Badge variant="outline" className="text-xs">
            {creditCost} credits
          </Badge>
        )}
      </div>

      <Select value={selectedModel} onValueChange={onSelectModel} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => {
            const isSelected = model.modelName === selectedModel;
            const tierColor = tierBadgeColors[model.tier];

            return (
              <SelectItem key={model.id} value={model.modelName}>
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                  <span className="flex-1">{model.modelName}</span>
                  {showTierBadge && (
                    <Badge className={`text-xs ${tierColor.bg} ${tierColor.text}`}>
                      {model.tier}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {selectedModelData && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Provider: {selectedModelData.provider}</span>
          <span>Max: {selectedModelData.maxTokens.toLocaleString()} tokens</span>
        </div>
      )}
    </div>
  );
}

export function getCreditCostByTier(tier: string): number {
  return creditCosts[tier] ?? 8; // Default to normal tier cost
}
