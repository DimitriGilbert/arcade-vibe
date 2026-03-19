import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import {
  CREATOR_IMPLEMENTATIONS,
  CREATOR_IDE_HINTS_ENABLED_PREFERENCE,
  db,
  LEADERBOARD_IMPLEMENTATIONS,
  PROFILE_IMPLEMENTATIONS,
  type UserPreferenceName,
} from "@arcade-vibe/db";
import { user, account, session, verification } from "@arcade-vibe/db/schema/auth";
import { userPreferences } from "@arcade-vibe/db/schema/user-preferences";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { collections, collectionGames } from "@arcade-vibe/db/schema/collections";
import { moderationReports, moderationAppeals } from "@arcade-vibe/db/schema/moderation";
import { scores } from "@arcade-vibe/db/schema/scores";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { feedback } from "@arcade-vibe/db/schema/feedback";
import { creditBatches, creditTransactions, userSubscriptions, userInvoices } from "@arcade-vibe/db/schema/credits";
import { emailLogs } from "@arcade-vibe/db/schema/email";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { gameScores, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { apiKeys } from "@arcade-vibe/db/schema/models";
import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "@arcade-vibe/api/middleware/rate-limit";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { sendForgotPasswordEmail, sendAccountDeletedEmail } from "@arcade-vibe/email";
import { env } from "@arcade-vibe/env/server";
import { gatherUserData, createExportZip } from "../lib/gdpr-export";

const scryptAsync = promisify(scrypt);
const leaderboardImplementationSchema = z.enum(LEADERBOARD_IMPLEMENTATIONS);
const creatorImplementationSchema = z.enum(CREATOR_IMPLEMENTATIONS);
const profileImplementationSchema = z.enum(PROFILE_IMPLEMENTATIONS);
const creatorIdeHintsEnabledSchema = z.boolean();
const DEFAULT_LEADERBOARD_IMPLEMENTATION: UserPreferenceName =
  "defaultLeaderboardImplementation";
const DEFAULT_CREATOR_IMPLEMENTATION: UserPreferenceName =
  "defaultCreatorImplementation";
const DEFAULT_PROFILE_IMPLEMENTATION: UserPreferenceName =
  "defaultProfileImplementation";
const CREATOR_IDE_HINTS_ENABLED: UserPreferenceName =
  CREATOR_IDE_HINTS_ENABLED_PREFERENCE;

function buildPreferencesRecord(
  preferences: Array<{ name: string; value: string }>,
): {
  defaultLeaderboardImplementation: z.infer<
    typeof leaderboardImplementationSchema
  > | null;
  defaultCreatorImplementation: z.infer<typeof creatorImplementationSchema> | null;
  defaultProfileImplementation: z.infer<typeof profileImplementationSchema> | null;
  creatorIdeHintsEnabled: z.infer<typeof creatorIdeHintsEnabledSchema>;
} {
  const preferencesMap = new Map(
    preferences.map((preference) => [preference.name, preference.value]),
  );

  const leaderboardValue = preferencesMap.get(DEFAULT_LEADERBOARD_IMPLEMENTATION);
  const creatorValue = preferencesMap.get(DEFAULT_CREATOR_IMPLEMENTATION);
  const profileValue = preferencesMap.get(DEFAULT_PROFILE_IMPLEMENTATION);
  const parsedLeaderboardValue =
    leaderboardValue !== undefined
      ? leaderboardImplementationSchema.safeParse(leaderboardValue)
      : null;
  const parsedCreatorValue =
    creatorValue !== undefined
      ? creatorImplementationSchema.safeParse(creatorValue)
      : null;
  const parsedProfileValue =
    profileValue !== undefined
      ? profileImplementationSchema.safeParse(profileValue)
      : null;
  const creatorIdeHintsEnabledValue = preferencesMap.get(CREATOR_IDE_HINTS_ENABLED);
  const parsedCreatorIdeHintsEnabledValue =
    creatorIdeHintsEnabledValue !== undefined
      ? z
          .enum(["true", "false"])
          .transform((value) => value === "true")
          .safeParse(creatorIdeHintsEnabledValue)
      : null;

  return {
    defaultLeaderboardImplementation:
      parsedLeaderboardValue?.success === true
        ? parsedLeaderboardValue.data
        : null,
    defaultCreatorImplementation:
      parsedCreatorValue?.success === true
        ? parsedCreatorValue.data
        : null,
    defaultProfileImplementation:
      parsedProfileValue?.success === true
        ? parsedProfileValue.data
        : null,
    creatorIdeHintsEnabled:
      parsedCreatorIdeHintsEnabledValue?.success === true
        ? parsedCreatorIdeHintsEnabledValue.data
        : true,
  };
}

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

    const preferences = await db.query.userPreferences.findMany({
      where: eq(userPreferences.userId, ctx.user.id),
      columns: {
        name: true,
        value: true,
      },
    });

    return buildPreferencesRecord(preferences);
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
        defaultProfileImplementation: profileImplementationSchema.nullable(),
        creatorIdeHintsEnabled: creatorIdeHintsEnabledSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const preferenceEntries = [
        {
          name: DEFAULT_LEADERBOARD_IMPLEMENTATION,
          value: input.defaultLeaderboardImplementation,
        },
        {
          name: DEFAULT_CREATOR_IMPLEMENTATION,
          value: input.defaultCreatorImplementation,
        },
        {
          name: DEFAULT_PROFILE_IMPLEMENTATION,
          value: input.defaultProfileImplementation,
        },
        {
          name: CREATOR_IDE_HINTS_ENABLED,
          value: String(input.creatorIdeHintsEnabled),
        },
      ] as const;

      await db.transaction(async (tx) => {
        for (const preference of preferenceEntries) {
          if (preference.value === null) {
            await tx
              .delete(userPreferences)
              .where(
                and(
                  eq(userPreferences.userId, ctx.user.id),
                  eq(userPreferences.name, preference.name),
                ),
              );
            continue;
          }

          await tx
            .insert(userPreferences)
            .values({
              userId: ctx.user.id,
              name: preference.name,
              value: preference.value,
            })
            .onConflictDoUpdate({
              target: [userPreferences.userId, userPreferences.name],
              set: {
                value: preference.value,
              },
            });
        }
      });

      const preferences = await db.query.userPreferences.findMany({
        where: eq(userPreferences.userId, ctx.user.id),
        columns: {
          name: true,
          value: true,
        },
      });

      return {
        success: true,
        preferences: buildPreferencesRecord(preferences),
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
  forgotPassword: publicProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .mutation(async ({ input }) => {
      // Look up user by email
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, input.email.toLowerCase()),
      });

      // Security: Always return success even if email not found
      // This prevents email enumeration attacks
      if (!existingUser) {
        return { success: true };
      }

      // Generate secure reset token (32 bytes, hex encoded = 64 characters)
      const resetToken = randomBytes(32).toString("hex");

      // Calculate expiry time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Delete any existing reset tokens for this user
      await db
        .delete(verification)
        .where(eq(verification.identifier, existingUser.email));

      // Store token in verification table
      await db.insert(verification).values({
        id: randomBytes(16).toString("hex"),
        identifier: existingUser.email,
        value: resetToken,
        expiresAt,
      });

      // Construct reset link
      const appUrl = env.NEXT_PUBLIC_APP_URL ?? env.CORS_ORIGIN;
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

      // Send forgot password email (fire and forget to not block response)
      sendForgotPasswordEmail({
        userId: existingUser.id,
        userEmail: existingUser.email,
        userName: existingUser.name,
        resetToken,
        resetLink,
      }).catch((error: unknown) => {
        console.error("Failed to send forgot password email:", error);
      });

      return { success: true };
    }),
  resetPassword: publicProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        newPassword: z
          .string()
          .min(12, "Password must be at least 12 characters")
          .max(128, "Password must be at most 128 characters"),
      }),
    )
    .mutation(async ({ input }) => {
      // Find and validate token
      const verificationRecord = await db.query.verification.findFirst({
        where: eq(verification.value, input.token),
      });

      if (!verificationRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Check if token is expired
      if (verificationRecord.expiresAt < new Date()) {
        // Delete expired token
        await db.delete(verification).where(eq(verification.id, verificationRecord.id));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reset token has expired",
        });
      }

      // Look up user by identifier (email) from verification record
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, verificationRecord.identifier),
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Look up credential account for this user
      const userAccount = await db.query.account.findFirst({
        where: and(
          eq(account.userId, existingUser.id),
          eq(account.providerId, "credential"),
        ),
      });

      // Hash new password
      const hashedPassword = await hashPassword(input.newPassword);

      // Update password in account table
      if (userAccount) {
        await db
          .update(account)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(account.id, userAccount.id));
      } else {
        // Create credential account if it doesn't exist (edge case for social-only users)
        await db.insert(account).values({
          id: randomBytes(16).toString("hex"),
          accountId: existingUser.id,
          providerId: "credential",
          userId: existingUser.id,
          password: hashedPassword,
        });
      }

      // Delete used token
      await db.delete(verification).where(eq(verification.id, verificationRecord.id));

      // Invalidate all user sessions
      await db.delete(session).where(eq(session.userId, existingUser.id));

      return {
        success: true,
        message: "Password reset successfully. Please log in with your new password.",
      };
    }),
  validateResetToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
      }),
    )
    .query(async ({ input }) => {
      // Find token in verification table
      const verificationRecord = await db.query.verification.findFirst({
        where: eq(verification.value, input.token),
      });

      // Check if token exists and is not expired
      const isValid =
        verificationRecord !== undefined && verificationRecord.expiresAt >= new Date();

      return { valid: isValid };
    }),
  exportData: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        includeGames: z.boolean().default(false),
      }).optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const userId = ctx.user.id;
      const includeGames = input?.includeGames ?? false;

      // Gather all user data
      const exportData = await gatherUserData(userId);

      // Log export action for audit
      console.log(`[AUDIT] GDPR data export requested: userId=${userId} exportedAt=${exportData.exportDate} includeGames=${includeGames}`);

      // If including games, create a ZIP file
      if (includeGames) {
        const { zipBuffer, filename } = await createExportZip(userId, exportData);
        const base64Zip = zipBuffer.toString("base64");
        
        return {
          success: true,
          data: null,
          zipData: base64Zip,
          filename,
          isZip: true,
        };
      }

      // Return as JSON for download
      return {
        success: true,
        data: exportData,
        zipData: null,
        filename: `user-data-export-${userId}-${new Date().toISOString().split("T")[0]}.json`,
        isZip: false,
      };
    }),
  deleteAccount: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        confirmation: z.string().refine(
          (val) => val === "DELETE MY ACCOUNT",
          { message: "Please type DELETE MY ACCOUNT to confirm account deletion" },
        ),
      }),
    )
    .mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const userId = ctx.user.id;
      const deletedAt = new Date();

      // Get user info before deletion for email
      const userInfo = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { id: true, email: true, name: true },
      });

      if (!userInfo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Perform all deletions in a transaction
      await db.transaction(async (tx) => {
        // 1. Delete user's collectionGames entries (via collections)
        const userCollections = await tx.query.collections.findMany({
          where: eq(collections.userId, userId),
          columns: { id: true },
        });
        
        for (const col of userCollections) {
          await tx.delete(collectionGames).where(eq(collectionGames.collectionId, col.id));
        }

        // 2. Delete user's collections
        await tx.delete(collections).where(eq(collections.userId, userId));

        // 3. Delete user's moderationAppeals (as appellant)
        await tx.delete(moderationAppeals).where(eq(moderationAppeals.appellantId, userId));

        // 4. Delete user's moderationReports (as reporter, set targetUserId to null for targets)
        // First set targetUserId to null for reports where this user is the target
        await tx
          .update(moderationReports)
          .set({ targetUserId: null })
          .where(eq(moderationReports.targetUserId, userId));
        // Then delete reports made by this user
        await tx.delete(moderationReports).where(eq(moderationReports.reporterId, userId));

        // 5. Delete user's scores
        await tx.delete(scores).where(eq(scores.userId, userId));

        // 6. Delete user's ratings
        await tx.delete(ratings).where(eq(ratings.userId, userId));

        // 7. Delete user's feedback
        await tx.delete(feedback).where(eq(feedback.userId, userId));

        // 8. Delete user's gameSessionMetrics
        await tx.delete(gameSessionMetrics).where(eq(gameSessionMetrics.userId, userId));

        // 9. Delete user's gameScores
        await tx.delete(gameScores).where(eq(gameScores.userId, userId));

        // 10. Handle user's prompts (delete - cascade is set)
        await tx.delete(prompts).where(eq(prompts.authorId, userId));

        // 11. Delete user's apiKeys
        await tx.delete(apiKeys).where(eq(apiKeys.userId, userId));

        // 12. Delete user's userSubscriptions
        await tx.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId));

        // 13. Delete user's creditTransactions
        await tx.delete(creditTransactions).where(eq(creditTransactions.userId, userId));

        // 14. Delete user's creditBatches
        await tx.delete(creditBatches).where(eq(creditBatches.userId, userId));

        // 15. Delete user's emailLogs
        await tx.delete(emailLogs).where(eq(emailLogs.userId, userId));

        // 16. Delete user's userPreferences
        await tx.delete(userPreferences).where(eq(userPreferences.userId, userId));

        // 17. Delete user's sessions
        await tx.delete(session).where(eq(session.userId, userId));

        // 18. Delete user's accounts (auth providers)
        await tx.delete(account).where(eq(account.userId, userId));

        // 19. Delete userInvoices
        await tx.delete(userInvoices).where(eq(userInvoices.userId, userId));

        // 20. Delete userExtended record
        await tx.delete(userExtended).where(eq(userExtended.id, userId));

        // 21. Delete user record
        await tx.delete(user).where(eq(user.id, userId));

        // Log deletion for audit
        console.log(`[AUDIT] Account deleted: userId=${userId} email=${userInfo.email} deletedAt=${deletedAt.toISOString()}`);
      });

      // Send account deletion confirmation email (fire and forget to not block response)
      sendAccountDeletedEmail({
        userId,
        userEmail: userInfo.email,
        userName: userInfo.name ?? "there",
        deletedAt,
      }).catch((error: unknown) => {
        console.error("Failed to send account deletion email:", error);
      });

      return { success: true };
    }),
});
