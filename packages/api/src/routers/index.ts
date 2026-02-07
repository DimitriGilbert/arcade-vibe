import { publicProcedure, router } from "../index";
import { creditsRouter } from "./credits";
import { apiKeysRouter } from "./api-keys";
import { themesRouter } from "./themes";
import { promptsRouter } from "./prompts";
import { gamesRouter } from "./games";
import { ratingsRouter } from "./ratings";
import { promptRunsRouter } from "./prompt-runs";
import { generateRouter } from "./generate";
import { leaderboardRouter } from "./leaderboard";
import { gameLeaderboardRouter } from "./game-leaderboard";
import { gameSdkRouter } from "./game-sdk";
import { moderationRouter } from "./moderation";
import { adminRouter } from "./admin";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  // Auth & User
  credits: creditsRouter,
  apiKeys: apiKeysRouter,

  // Content
  themes: themesRouter,
  prompts: promptsRouter,
  games: gamesRouter,
  ratings: ratingsRouter,
  promptRuns: promptRunsRouter,

  // Generation
  generate: generateRouter,

  // Leaderboards
  leaderboard: leaderboardRouter,
  gameLeaderboard: gameLeaderboardRouter,
  gameSdk: gameSdkRouter,

  // Moderation
  moderation: moderationRouter,

  // Admin
  admin: adminRouter, // combines models, direct, plans
});

export type AppRouter = typeof appRouter;
