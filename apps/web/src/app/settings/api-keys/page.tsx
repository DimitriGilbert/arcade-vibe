"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Key, Plus, Trash2, Copy, Check } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const apiKeySchema = z.object({
  provider: z.enum([
    "openai",
    "anthropic",
    "google",
    "openrouter",
    "deepseek",
    "glm",
    "glm-coding-plan",
    "moonshot",
    "custom",
  ]),
  apiKey: z.string().min(1, "API key is required"),
  name: z.string().min(1, "Name is required").default("Default Key"),
  customEndpoint: z.string().url().optional().or(z.literal("")),
});

// Provider display names and descriptions
const PROVIDER_INFO: Record<string, { name: string; description: string; color: string }> = {
  openai: { name: "OpenAI", description: "GPT models (GPT-4, GPT-4o, etc.)", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  anthropic: { name: "Anthropic", description: "Claude models (Claude 3.5 Sonnet, Opus)", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  google: { name: "Google", description: "Gemini models", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  openrouter: { name: "OpenRouter", description: "Access to 400+ AI models", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  deepseek: { name: "DeepSeek", description: "DeepSeek-V2 models", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  glm: { name: "GLM", description: "Zhipu AI GLM models", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  "glm-coding-plan": { name: "GLM Coding Plan", description: "GLM-4.7 for coding", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  moonshot: { name: "Moonshot", description: "Moonshot AI models", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400" },
  custom: { name: "Custom", description: "Custom endpoint", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

// Mask API key - show only first 8 characters and asterisks for the rest
function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return "••••••••";
  return `${key.slice(0, 8)}${"•".repeat(Math.max(8, key.length - 8))}`;
}

export default function ApiKeysSettingsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Fetch API keys
  const { data: apiKeys, isLoading: keysLoading, refetch } = useQuery({
    queryKey: ["apiKeys", "list"],
    queryFn: () => trpcClient.apiKeys.listKeys.query(),
    enabled: !!session,
  });

  // Add API key mutation
  const addKeyMutation = useMutation({
    mutationFn: async (input: z.infer<typeof apiKeySchema>) => {
      return await trpcClient.apiKeys.addKey.mutate(input);
    },
    onSuccess: () => {
      toast.success("API key added successfully!");
      setShowAddForm(false);
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add API key");
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.apiKeys.deleteKey.mutate({ id });
    },
    onSuccess: () => {
      toast.success("API key deleted successfully!");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete API key");
    },
  });

  // Initialize Formedible at top level (not conditionally)
  const { Form } = useFormedible({
    schema: apiKeySchema,
    fields: [
      {
        name: "provider",
        type: "select",
        label: "Provider",
        description: "Select the AI provider for this API key",
        options: Object.entries(PROVIDER_INFO).map(([value, info]) => ({
          value,
          label: `${info.name} - ${info.description}`,
        })),
      },
      {
        name: "name",
        type: "text",
        label: "Key Name",
        description: "A friendly name to identify this key",
        placeholder: "My API Key",
      },
      {
        name: "apiKey",
        type: "password",
        label: "API Key",
        description: "Paste your API key here (never stored in plain text)",
        placeholder: "sk-...",
      },
      {
        name: "customEndpoint",
        type: "text",
        label: "Custom Endpoint (Optional)",
        description: "Custom API endpoint URL (for custom provider only)",
        placeholder: "https://api.example.com/v1",
        conditional: (values) => values.provider === "custom",
      },
    ],
    formOptions: {
      defaultValues: {
        provider: "openai",
        apiKey: "",
        name: "Default Key",
        customEndpoint: "",
      },
      onSubmit: async ({ value }) => {
        addKeyMutation.mutate(value);
      },
    },
  });

  const handleCopyKey = (maskedKey: string, keyId: string) => {
    navigator.clipboard.writeText(maskedKey);
    setCopiedKeyId(keyId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (sessionPending || keysLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      </div>
    );
  }

  const keys = apiKeys ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
            <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">
              Manage your BYOK (Bring Your Own Key) API keys
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Security Notice
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your API keys are encrypted and never displayed in full. We only use them to make requests
            on your behalf to the AI providers. You can delete keys at any time.
          </p>
        </CardContent>
      </Card>

      {/* Add API Key Form */}
      {showAddForm ? (
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle>Add New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <Form className="space-y-4" />
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={addKeyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={addKeyMutation.isPending}
              >
                {addKeyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add API Key
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      )}

      {/* API Keys List */}
      {keys.length === 0 ? (
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-20 text-center">
            <Key className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first API key to start using your own AI provider credits
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys.map((apiKey) => {
            const providerInfo = PROVIDER_INFO[apiKey.provider] || PROVIDER_INFO.custom;
            return (
              <Card key={apiKey.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <Badge className={providerInfo.color}>
                          {providerInfo.name}
                        </Badge>
                        {apiKey.isActive ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded">
                          {maskApiKey(apiKey.id.slice(0, 16))}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(maskApiKey(apiKey.id.slice(0, 16)), apiKey.id)}
                        >
                          {copiedKeyId === apiKey.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Added {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                        {apiKey.lastUsedAt && (
                          <p>Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                      disabled={deleteKeyMutation.isPending}
                    >
                      {deleteKeyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Provider Information */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Supported Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PROVIDER_INFO).map(([provider, info]) => (
              <div
                key={provider}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
              >
                <h4 className="font-semibold mb-1">{info.name}</h4>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
