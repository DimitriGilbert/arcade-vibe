import type { RouterOutput } from "@/lib/trpc-types";

export type LeaderboardEntry = RouterOutput["leaderboard"]["getTop"] extends (infer T)[] ? T : never;

export type LeaderboardGame = LeaderboardEntry extends { game?: infer G } ? NonNullable<G> : never;

export type LeaderboardPrompt = LeaderboardGame extends { prompt?: infer P } ? NonNullable<P> : never;

export type LeaderboardTheme = LeaderboardGame extends { theme?: infer T } ? NonNullable<T> : never;
