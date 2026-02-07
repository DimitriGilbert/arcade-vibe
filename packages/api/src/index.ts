import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin access required",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const moderatorProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== "admin" && ctx.user.role !== "moderator")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Moderator access required",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
