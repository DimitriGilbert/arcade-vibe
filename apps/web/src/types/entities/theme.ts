import type { RouterOutput } from "@/lib/trpc-types";

export type Theme = RouterOutput["themes"]["getById"] & {
  requirements: Record<string, unknown> | null;
};

export type ThemeList = RouterOutput["themes"]["list"][number] & {
  requirements?: Record<string, unknown> | null;
  systemPrompt?: string;
};

export type ThemeVisibility = Theme["visibility"];

export type ThemeStatus = Theme["status"];
