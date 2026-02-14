import { db } from "@arcade-vibe/db";
import * as schema from "@arcade-vibe/db/schema/auth";
import { creditBatches } from "@arcade-vibe/db/schema/credits";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { env } from "@arcade-vibe/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

// Credit expiry constants (mirrored from api/lib/credits.ts to avoid circular dependency)
const CREDIT_EXPIRY_FREE_TRIAL_DAYS = 30;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const initialCredits = env.INITIAL_CREDITS;

          // Create user_extended record with 0 credits (will be updated by batch)
          await db
            .insert(userExtended)
            .values({
              id: user.id,
              role: "participant",
              reputation: 0,
              credits: initialCredits, // Denormalized balance for quick display
              isSuspended: false,
            })
            .onConflictDoNothing();

          // Create initial credit batch with free_trial type (30-day expiry)
          const expiresAt = new Date();
          expiresAt.setDate(
            expiresAt.getDate() + CREDIT_EXPIRY_FREE_TRIAL_DAYS,
          );

          await db.insert(creditBatches).values({
            userId: user.id,
            amount: initialCredits,
            remainingAmount: initialCredits,
            sourceType: "free_trial",
            expiresAt,
          });
        },
      },
    },
  },
});

// Helper to get user role from userExtended table
export async function getUserRole(
  userId: string,
): Promise<"admin" | "moderator" | "participant" | "viewer"> {
  const extended = await db.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: { role: true },
  });
  return extended?.role ?? "participant";
}
