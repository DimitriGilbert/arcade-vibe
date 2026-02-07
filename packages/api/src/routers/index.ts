import { protectedProcedure, publicProcedure, router } from "../index";
import { todoRouter } from "./todo";
import { creditsRouter } from "./credits";
import { themesRouter } from "./themes";
import { promptsRouter } from "./prompts";
import { apiKeysRouter } from "./api-keys";
import { modelConfigRouter } from "./admin/models";

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
  apiKeys: apiKeysRouter,
  modelConfig: modelConfigRouter,
});
export type AppRouter = typeof appRouter;
