import type { RouterOutput } from "@/lib/trpc-types";

export type Game = RouterOutput["games"]["getById"];

export type GameFromApi = RouterOutput["games"]["listByTheme"][number];

export type GameWithRanking = Game & {
  ranking: number | null;
};

export type GamePrompt = NonNullable<Game["prompt"]>;

export type GameTheme = NonNullable<Game["theme"]>;

export type GameStatus = "pending" | "processing" | "completed" | "failed";
