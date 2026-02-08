"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import { ArcadeButton } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
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
const PROVIDER_INFO: Record<string, { name: string; description: string }> = {
  openai: { name: "OpenAI", description: "GPT models (GPT-4, GPT-4o, etc.)" },
  anthropic: {
    name: "Anthropic",
    description: "Claude models (Claude 3.5 Sonnet, Opus)",
  },
  google: { name: "Google", description: "Gemini models" },
  openrouter: { name: "OpenRouter", description: "Access to 400+ AI models" },
  deepseek: { name: "DeepSeek", description: "DeepSeek-V2 models" },
  glm: { name: "GLM", description: "Zhipu AI GLM models" },
  "glm-coding-plan": {
    name: "GLM Coding Plan",
    description: "GLM-4.7 for coding",
  },
  moonshot: { name: "Moonshot", description: "Moonshot AI models" },
  custom: { name: "Custom", description: "Custom endpoint" },
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
  const {
    data: apiKeys,
    isLoading: keysLoading,
    refetch,
  } = useQuery({
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
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[var(--primary)]" />
          <p className="text-[var(--muted-foreground)]">Loading API keys...</p>
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
          <div className="p-3 bg-[var(--muted)]/60 rounded-lg">
            <Key className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-[var(--muted-foreground)]">
              Manage your BYOK (Bring Your Own Key) API keys
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <ArcadeCard className="">
        <div className="p-6">
          <h3 className="font-semibold text-[var(--accent)] mb-2">
            Security Notice
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Your API keys are encrypted and never displayed in full. We only use
            them to make requests on your behalf to the AI providers. You can
            delete keys at any time.
          </p>
        </div>
      </ArcadeCard>

      {/* Add API Key Form */}
      {showAddForm ? (
        <ArcadeCard className="">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Add New API Key
            </h3>
          </div>
          <div className="p-4">
            <Form className="space-y-4" />
            <div className="flex gap-2 mt-4">
              <ArcadeButton
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={addKeyMutation.isPending}
              >
                Cancel
              </ArcadeButton>
              <ArcadeButton
                variant="primary"
                onClick={() => {
                  const form = document.querySelector("form");
                  if (form) {
                    form.requestSubmit();
                  }
                }}
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
              </ArcadeButton>
            </div>
          </div>
        </ArcadeCard>
      ) : (
        <ArcadeButton variant="primary" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </ArcadeButton>
      )}

      {/* API Keys List */}
      {keys.length === 0 ? (
        <ArcadeCard className="">
          <div className="p-20 text-center">
            <Key className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Add your first API key to start using your own AI provider credits
            </p>
          </div>
        </ArcadeCard>
      ) : (
        <div className="space-y-4">
          {keys.map((apiKey) => {
            const providerInfo =
              PROVIDER_INFO[apiKey.provider] || PROVIDER_INFO.custom;
            return (
              <ArcadeCard key={apiKey.id} className="">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <ArcadeBadge
                          text={providerInfo.name}
                          variant="default"
                        />
                        {apiKey.isActive ? (
                          <ArcadeBadge text="Active" variant="neon" />
                        ) : (
                          <ArcadeBadge text="Inactive" variant="default" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-[var(--muted)] px-3 py-1 rounded">
                          {maskApiKey(apiKey.id.slice(0, 16))}
                        </code>
                        <ArcadeButton
                          variant="outline"
                          onClick={() =>
                            handleCopyKey(
                              maskApiKey(apiKey.id.slice(0, 16)),
                              apiKey.id,
                            )
                          }
                          className="p-2"
                        >
                          {copiedKeyId === apiKey.id ? (
                            <Check className="h-4 w-4 text-[var(--accent)]" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </ArcadeButton>
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        <p>
                          Added{" "}
                          {new Date(apiKey.createdAt).toLocaleDateString()}
                        </p>
                        {apiKey.lastUsedAt && (
                          <p>
                            Last used{" "}
                            {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArcadeButton
                      variant="outline"
                      onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                      disabled={deleteKeyMutation.isPending}
                      className="text-[var(--destructive)] hover:text-[var(--destructive)]"
                    >
                      {deleteKeyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </ArcadeButton>
                  </div>
                </div>
              </ArcadeCard>
            );
          })}
        </div>
      )}

      {/* Provider Information */}
      <ArcadeCard className="">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">
            Supported Providers
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PROVIDER_INFO).map(([provider, info]) => (
              <div
                key={provider}
                className="p-4 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]"
              >
                <h4 className="font-semibold mb-1">{info.name}</h4>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ArcadeCard>
    </div>
  );
}
