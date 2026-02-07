"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Edit2, Power, Search, ArrowUpDown, Zap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

type SortField = "provider" | "modelName" | "tier" | "cost";
type SortOrder = "asc" | "desc";

export default function AdminModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("modelName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [addingModel, setAddingModel] = useState(false);

  // Fetch all models
  const { data: models, isLoading, refetch } = useQuery({
    queryKey: ["admin-models"],
    queryFn: async () => {
      return await trpcClient.admin.models.getModels.query();
    },
  });

  // Toggle model active mutation
  const toggleModelMutation = useMutation({
    mutationFn: async (input: { id: string; isActive: boolean }) => {
      return await trpcClient.admin.models.toggleModelActive.mutate(input);
    },
    onSuccess: () => {
      toast.success("Model status updated!");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update model");
    },
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (input: { id: string; costPer1kTokens: string }) => {
      return await trpcClient.admin.models.updateModelPricing.mutate(input);
    },
    onSuccess: () => {
      toast.success("Pricing updated successfully!");
      refetch();
      setEditingModel(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update pricing");
    },
  });

  // Add new model mutation
  const addModelMutation = useMutation({
    mutationFn: async (input: {
      provider: "openai" | "anthropic" | "google" | "openrouter" | "deepseek" | "glm" | "glm-coding-plan" | "moonshot" | "custom";
      modelName: string;
      tier: "cheater" | "easy" | "normal" | "hard" | "impossible";
      costPer1kTokens: string;
      maxTokens: number;
      supportsImages: boolean;
      isActive: boolean;
    }) => {
      return await trpcClient.admin.models.addModel.mutate(input);
    },
    onSuccess: () => {
      toast.success("Model added successfully!");
      refetch();
      setAddingModel(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add model");
    },
  });

  // Filter and sort models
  const filteredModels = useMemo(() => {
    if (!models) return [];

    let result = [...models];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((model) =>
        model.modelName.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "provider": {
          comparison = a.provider.localeCompare(b.provider);
          break;
        }
        case "modelName": {
          comparison = a.modelName.localeCompare(b.modelName);
          break;
        }
        case "tier": {
          const tierOrder: Record<string, number> = {
            cheater:1,
            easy:2,
            normal:3,
            hard:4,
            impossible:5,
          };
          comparison = (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
          break;
        }
        case "cost": {
          comparison = parseFloat(a.costPer1kTokens) - parseFloat(b.costPer1kTokens);
          break;
        }
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [models, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const ModelForm = ({ mode, model }: { mode: "add" | "edit"; model?: Model }) => {
    const schema = z.object({
      id: z.string().uuid().optional(),
      provider: z.enum(["openai", "anthropic", "google", "openrouter", "deepseek", "glm", "glm-coding-plan", "moonshot", "custom"]),
      modelName: z.string().min(1).max(100),
      tier: z.enum(["cheater", "easy", "normal", "hard", "impossible"]),
      costPer1kTokens: z.string().min(1),
      maxTokens: z.number().int().positive(),
      supportsImages: z.boolean().default(false),
      isActive: z.boolean().default(true),
    });

    const isAddMode = mode === "add";
    const { Form } = useFormedible({
      schema,
      fields: [
        { name: "provider", type: "select", label: "Provider", options: [
          { value: "openai", label: "OpenAI" },
          { value: "anthropic", label: "Anthropic" },
          { value: "google", label: "Google" },
          { value: "openrouter", label: "OpenRouter" },
          { value: "deepseek", label: "DeepSeek" },
          { value: "glm", label: "GLM" },
          { value: "glm-coding-plan", label: "GLM Coding Plan" },
          { value: "moonshot", label: "Moonshot" },
          { value: "custom", label: "Custom" },
        ]},
        { name: "modelName", type: "text", label: "Model Name" },
        { name: "tier", type: "select", label: "Difficulty Tier", options: [
          { value: "cheater", label: "Cheater (Easiest)" },
          { value: "easy", label: "Easy" },
          { value: "normal", label: "Normal" },
          { value: "hard", label: "Hard" },
          { value: "impossible", label: "Impossible (Hardest)" },
        ]},
        { name: "costPer1kTokens", type: "text", label: "Cost per 1k Tokens" },
        { name: "maxTokens", type: "number", label: "Max Tokens", min: 1 },
        { name: "supportsImages", type: "switch", label: "Supports Images" },
        { name: "isActive", type: "switch", label: "Active" },
      ],
      formOptions: {
        defaultValues: isAddMode ? {
          provider: "openai",
          modelName: "",
          tier: "normal",
          costPer1kTokens: "0.01",
          maxTokens: 128000,
          supportsImages: false,
          isActive: true,
        } : model ? {
          id: model.id,
          provider: model.provider as "openai" | "anthropic" | "google" | "openrouter" | "deepseek" | "glm" | "glm-coding-plan" | "moonshot" | "custom",
          modelName: model.modelName,
          tier: model.tier as "cheater" | "easy" | "normal" | "hard" | "impossible",
          costPer1kTokens: model.costPer1kTokens,
          maxTokens: model.maxTokens,
          supportsImages: model.supportsImages,
          isActive: model.isActive,
        } : undefined,
        onSubmit: async ({ value }) => {
          if (isAddMode) {
            await addModelMutation.mutateAsync({
              provider: value.provider as "openai" | "anthropic" | "google" | "openrouter" | "deepseek" | "glm" | "glm-coding-plan" | "moonshot" | "custom",
              modelName: value.modelName,
              tier: value.tier as "cheater" | "easy" | "normal" | "hard" | "impossible",
              costPer1kTokens: value.costPer1kTokens,
              maxTokens: value.maxTokens,
              supportsImages: value.supportsImages || false,
              isActive: value.isActive || false,
            });
          } else {
            if (value.id) {
              await updatePricingMutation.mutateAsync({
                id: value.id,
                costPer1kTokens: value.costPer1kTokens,
              });
            }
          }
        },
      },
    });

    return <Form className="space-y-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Models
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage AI model configurations and pricing
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddingModel(true)}>
          <Plus className="h-4 w-4" />
          Add Model
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models Table */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {[
                    { field: "provider" as SortField, label: "Provider" },
                    { field: "modelName" as SortField, label: "Model Name" },
                    { field: "tier" as SortField, label: "Tier" },
                    { field: "cost" as SortField, label: "Cost/1k" },
                  ].map((column) => (
                    <th
                      key={column.field}
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort(column.field)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Max Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Images
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No models found
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((model) => (
                    <tr
                      key={model.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {model.provider}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{model.modelName}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const tierColors: Record<string, string> = {
                            cheater: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                            easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            impossible: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                          };
                          return (
                            <Badge
                              variant={model.tier === "cheater" ? "destructive" : "default"}
                              className={cn("capitalize", tierColors[model.tier])}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              {model.tier}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">${model.costPer1kTokens}</td>
                      <td className="px-4 py-3">{model.maxTokens.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {model.supportsImages ? "✓" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={model.isActive ? "default" : "secondary"}
                          className={cn(
                            model.isActive && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          )}
                        >
                          {model.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleModelMutation.mutate({ id: model.id, isActive: !model.isActive })}
                            disabled={toggleModelMutation.isPending}
                          >
                            <Power className={`h-4 w-4 ${model.isActive ? "text-orange-500" : "text-green-500"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingModel(model)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Model Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Model Configuration</DialogTitle>
            <DialogDescription>
              Update model pricing and settings
            </DialogDescription>
          </DialogHeader>
          {editingModel && <ModelForm mode="edit" model={editingModel} />}
        </DialogContent>
      </Dialog>

      {/* Add Model Dialog */}
      <Dialog open={addingModel} onOpenChange={setAddingModel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Model</DialogTitle>
            <DialogDescription>
              Configure a new AI model for the platform
            </DialogDescription>
          </DialogHeader>
          <ModelForm mode="add" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Model = {
  id: string;
  provider: string;
  modelName: string;
  tier: string;
  costPer1kTokens: string;
  maxTokens: number;
  supportsImages: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
