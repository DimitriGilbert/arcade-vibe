import type { RouterOutput } from "@/lib/trpc-types";

export type Prompt = RouterOutput["prompts"]["getById"];

export type PromptList = Prompt[];

export type PromptVersion = RouterOutput["prompts"]["listVersions"][number];

export type PromptAuthor = RouterOutput["games"]["getById"]["prompt"]["user"];

export type PromptVisibility = "private" | "public_on_freeze" | "public";

export type PromptStatus = "draft" | "submitted" | "disqualified";
