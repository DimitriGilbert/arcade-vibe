import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import {
  CREATOR_IMPLEMENTATIONS,
  db,
  LEADERBOARD_IMPLEMENTATIONS,
} from "@arcade-vibe/db";
import { user, account, session } from "@arcade-vibe/db/schema/auth";
import { userPreferences } from "@arcade-vibe/db/schema/user-preferences";
import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "@arcade-vibe/api/middleware/rate-limit";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const leaderboardImplementationSchema = z.enum(LEADERBOARD_IMPLEMENTATIONS);
const creatorImplementationSchema = z.enum(CREATOR_IMPLEMENTATIONS);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuffer = Buffer.from(hash, "hex");
  if (derivedKey.length !== hashBuffer.length) return false;
  return timingSafeEqual(derivedKey, hashBuffer);
}

/**
 * User Router
 *
 * Provides user-specific operations:
 * - getByName: Get user by name (public, no email exposed)
 * - updateProfile: Update user's name
 * - changePassword: Change user password with session invalidation
 */
export const userRouter = router({
  getByName: publicProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const result = await db.query.user.findFirst({
        where: eq(user.name, input.name),
        columns: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return result;
    }),
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.user.id),
      columns: {
        defaultLeaderboardImplementation: true,
        defaultCreatorImplementation: true,
      },
    });

    return {
      defaultLeaderboardImplementation:
        preferences?.defaultLeaderboardImplementation ?? null,
      defaultCreatorImplementation:
        preferences?.defaultCreatorImplementation ?? null,
    };
  }),
  updateProfile: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        name: z.string().min(2).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Update user name
      const result = await db
        .update(user)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.user.id))
        .returning({
          id: user.id,
          name: user.name,
          image: user.image,
        });

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        success: true,
        user: result[0],
      };
    }),
  updatePreferences: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        defaultLeaderboardImplementation:
          leaderboardImplementationSchema.nullable(),
        defaultCreatorImplementation: creatorImplementationSchema.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const [preferences] = await db
        .insert(userPreferences)
        .values({
          userId: ctx.user.id,
          defaultLeaderboardImplementation:
            input.defaultLeaderboardImplementation,
          defaultCreatorImplementation: input.defaultCreatorImplementation,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            defaultLeaderboardImplementation:
              input.defaultLeaderboardImplementation,
            defaultCreatorImplementation: input.defaultCreatorImplementation,
            updatedAt: new Date(),
          },
        })
        .returning({
          defaultLeaderboardImplementation:
            userPreferences.defaultLeaderboardImplementation,
          defaultCreatorImplementation:
            userPreferences.defaultCreatorImplementation,
        });

      return {
        success: true,
        preferences: {
          defaultLeaderboardImplementation:
            preferences?.defaultLeaderboardImplementation ?? null,
          defaultCreatorImplementation:
            preferences?.defaultCreatorImplementation ?? null,
        },
      };
    }),
  changePassword: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        currentPassword: z.string().min(12, "Password must be at least 12 characters"),
        newPassword: z.string().min(12, "Password must be at least 12 characters").max(128),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const userAccount = await db.query.account.findFirst({
        where: and(
          eq(account.userId, ctx.user.id),
          eq(account.providerId, "credential"),
        ),
      });

      if (!userAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const isValid = await verifyPassword(input.currentPassword, userAccount.password ?? "");

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const hashedNewPassword = await hashPassword(input.newPassword);

      await db
        .update(account)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.id, userAccount.id));

      const currentSessionToken = ctx.req?.headers
        .get("cookie")
        ?.match(/better-auth\.session_token=([^;]+)/)?.[1];

      if (currentSessionToken) {
        await db
          .delete(session)
          .where(
            and(
              eq(session.userId, ctx.user.id),
              ne(session.token, currentSessionToken),
            ),
          );
      } else {
        await db.delete(session).where(eq(session.userId, ctx.user.id));
      }

      return {
        success: true,
        message: "Password changed successfully. Other sessions have been invalidated.",
      };
    }),
});
