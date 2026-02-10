import { publicProcedure, router } from "../index";
import { creditsRouter } from "./credits";
import { billingRouter } from "./billing";
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
import { modelsRouter } from "./models";
import { userRouter } from "./user";
import { stripeRouter } from "./stripe";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  // Auth & User
  user: userRouter,
  credits: creditsRouter,
  billing: billingRouter,
  apiKeys: apiKeysRouter,

  // Content
  themes: themesRouter,
  prompts: promptsRouter,
  games: gamesRouter,
  ratings: ratingsRouter,
  promptRuns: promptRunsRouter,

  // Models
  models: modelsRouter,

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

  // Payments
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
