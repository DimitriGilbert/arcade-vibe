import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "../context";
import { redis } from "../lib/redis";
import { z } from "zod";

export const rateLimitConfigSchema = z.object({
  windowMs: z
    .number()
    .positive()
    .default(60 * 1000),
  maxRequests: z.number().positive().default(10),
  keyPrefix: z.string().default("ratelimit"),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

const t = initTRPC.context<Context>().create();

export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const validatedConfig = rateLimitConfigSchema.parse(config);

  return t.middleware(async ({ ctx, next }) => {
    const userId = ctx.user?.id || ctx.session?.user?.id;
    const ip =
      ctx.req?.headers.get("x-forwarded-for") ||
      ctx.req?.headers.get("x-real-ip") ||
      "anonymous";

    const identifier = userId || ip;
    const key = `${validatedConfig.keyPrefix}:${identifier}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(validatedConfig.windowMs / 1000));
      }

      if (current > validatedConfig.maxRequests) {
        const ttl = await redis.ttl(key);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
        });
      }

      return next();
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Rate limiting error:", error);
      return next();
    }
  });
};

export const rateLimits = {
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: "ratelimit:strict",
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: "ratelimit:default",
  },
  loose: { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "ratelimit:loose" },
};
