import { protectedProcedure, publicProcedure, router } from "../index";
import { todoRouter } from "./todo";
import { creditsRouter } from "./credits";
import { themesRouter } from "./themes";
import { promptsRouter } from "./prompts";
import { promptRunsRouter } from "./prompt-runs";
import { apiKeysRouter } from "./api-keys";
import { modelConfigRouter } from "./admin/models";
import { generateRouter } from "./generate";
import { gameSdkRouter } from "./game-sdk";
import { gamesRouter } from "./games";
import { ratingsRouter } from "./ratings";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
  credits: creditsRouter,
  themes: themesRouter,
  prompts: promptsRouter,
  promptRuns: promptRunsRouter,
  apiKeys: apiKeysRouter,
  modelConfig: modelConfigRouter,
  generate: generateRouter,
  gameSdk: gameSdkRouter,
  games: gamesRouter,
  ratings: ratingsRouter,
  leaderboard: leaderboardRouter,
});
export type AppRouter = typeof appRouter;
