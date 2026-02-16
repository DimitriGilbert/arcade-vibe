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
  /**
   * @security Account Lockout Notice
   *
   * Account lockout protection is implemented at the API layer via rate limiting
   * middleware (see packages/api/src/middleware/rate-limit.ts).
   *
   * For additional security, consider implementing:
   * - Failed login attempt tracking in the database
   * - Progressive delays after failed attempts
   * - Account suspension after N failed attempts
   * - Email notification on lockout
   *
   * Better Auth does not provide built-in account lockout. This would require
   * custom implementation via database hooks or middleware.
   */
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const initialCredits = env.INITIAL_CREDITS;

          // Create initial credit batch with free_trial type (30-day expiry)
          const expiresAt = new Date();
          expiresAt.setDate(
            expiresAt.getDate() + CREDIT_EXPIRY_FREE_TRIAL_DAYS,
          );

          // CB-006: Wrap in transaction for atomicity
          await db.transaction(async (tx) => {
            // Create user_extended record with initial credits
            await tx.insert(userExtended).values({
              id: user.id,
              role: "participant",
              reputation: 0,
              credits: initialCredits,
              isSuspended: false,
            });

            // Create initial credit batch
            await tx.insert(creditBatches).values({
              userId: user.id,
              amount: initialCredits,
              remainingAmount: initialCredits,
              sourceType: "free_trial",
              expiresAt,
            });
          });
        },
      },
    },
  },
});

// Helper to get user role from userExtended table
/**
 * Get user role from userExtended table
 *
 * @throws Error if user_extended record does not exist
 * @security Returning a default role for missing records would be a security risk
 *           as it could grant unintended permissions. A missing record indicates
 *           a data integrity issue that should be surfaced.
 */
export async function getUserRole(
  userId: string,
): Promise<"admin" | "moderator" | "participant" | "viewer"> {
  const extended = await db.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: { role: true },
  });

  if (!extended) {
    throw new Error(
      `User extended record not found for user ${userId}. This indicates a data integrity issue.`,
    );
  }

  return extended.role;
}
