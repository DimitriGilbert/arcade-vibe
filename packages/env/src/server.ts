import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    ENCRYPTION_KEY: z.string().length(32),
    GAME_SDK_SECRET: z.string().min(32),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    REDIS_URL: z.string().url().optional(),
    NEXT_PUBLIC_API_URL: z.url().optional(),
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    // Initial credits given to new users on signup (default: 20)
    INITIAL_CREDITS: z.coerce.number().int().min(0).default(20),
    OPENROUTER_APP_NAME: z.string().min(1).default("Arcade-Vibe"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
