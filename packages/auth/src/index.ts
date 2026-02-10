import { db } from "@arcade-vibe/db";
import * as schema from "@arcade-vibe/db/schema/auth";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { env } from "@arcade-vibe/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db
            .insert(userExtended)
            .values({
              id: user.id,
              role: "participant",
              reputation: 0,
              credits: 100,
              isSuspended: false,
            })
            .onConflictDoNothing();
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
