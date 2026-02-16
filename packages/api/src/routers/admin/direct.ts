import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { user } from "@arcade-vibe/db/schema/auth";
import { adminActions, scoringWeights } from "@arcade-vibe/db/schema/platform";
import { moderationReports } from "@arcade-vibe/db/schema/moderation";
import { z } from "zod";
import { eq, and, asc, desc, type SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { redis } from "@arcade-vibe/api/lib/redis";
import { calculateGameScore } from "@arcade-vibe/api/lib/scoring";
import {
  getValidCreditBalance,
  addCreditsInternal,
} from "@arcade-vibe/api/lib/credits";

/**
 * Recalculate scores for all games in a theme
 * Called when scoring weights are updated
 */
async function recalculateThemeScores(themeId: string): Promise<void> {
  // Fetch all games for theme
  const themeGames = await db.query.games.findMany({
    where: eq(games.themeId, themeId),
    columns: { id: true },
  });

  // Recalculate each score using the scoring engine
  for (const game of themeGames) {
    await calculateGameScore(game.id);
  }
}

/**
 * Admin Direct Actions Router
 *
 * PRD Reference: Lines 2095-2182 (Direct Admin Actions) and Lines 2469-2527 (Scoring Weight Adjustment)
 *
 * Provides direct admin actions:
 * - hideGame: Directly hide a game with a reason
 * - suspendUser: Suspend a user with duration options
 * - updateScoringWeights: Update theme scoring weights (using upsert pattern)
 * - getModerationQueue: Get flagged content queue for severe cases
 */

export const directActionsRouter = router({
  /**
   * Get Users
   *
   * List all users with their extended data for admin management.
   */
  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const users = await db.query.userExtended.findMany({
        limit: input.limit,
        offset: input.offset,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
            },
          },
        },
      });

      return users.map((u) => ({
        id: u.id,
        name: u.user?.name ?? null,
        email: u.user?.email ?? "",
        image: u.user?.image ?? null,
        role: u.role,
        credits: u.credits,
        isSuspended: u.isSuspended,
        suspensionReason: u.suspensionReason,
        reputation: u.reputation,
        createdAt: u.user?.createdAt ?? null,
      }));
    }),

  /**
   * Update User
   *
   * Admin updates a user's profile information.
   * - Can update: name, role, credits
   * - Logs action to adminActions
   */
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        role: z.enum(["admin", "moderator", "participant", "viewer"]).optional(),
        credits: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const targetUser = await db.query.userExtended.findFirst({
        where: eq(userExtended.id, input.userId),
        with: {
          user: {
            columns: {
              id: true,
            },
          },
        },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (input.role !== undefined) {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot change your own role",
          });
        }

        if (targetUser.role === "admin" && input.role !== "admin") {
          const adminCount = await db.query.userExtended.findMany({
            where: eq(userExtended.role, "admin"),
            columns: { id: true },
          });
          if (adminCount.length <= 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot demote the last admin",
            });
          }
        }

        const oldRole = targetUser.role;

        await db
          .update(userExtended)
          .set({ role: input.role })
          .where(eq(userExtended.id, input.userId));

        await db.insert(adminActions).values({
          adminId: ctx.user.id,
          actionType: "role_change",
          targetType: "user",
          targetId: input.userId,
          reason: `Role changed from ${oldRole} to ${input.role}`,
          metadata: JSON.stringify({ oldRole, newRole: input.role }),
        });
      }

      if (input.credits !== undefined) {
        const currentBalance = await getValidCreditBalance(input.userId);
        const difference = input.credits - currentBalance;

        if (difference > 0) {
          await addCreditsInternal(
            input.userId,
            difference,
            "Admin credit grant",
            "admin_grant",
          );
        } else if (difference < 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot reduce credits below current balance",
          });
        }
      }

      if (input.name !== undefined) {
        await db
          .update(user)
          .set({ name: input.name })
          .where(eq(user.id, input.userId));
      }

      if (input.name !== undefined || input.credits !== undefined) {
        await db.insert(adminActions).values({
          adminId: ctx.user.id,
          actionType: "update_user",
          targetType: "user",
          targetId: input.userId,
          reason: `Updated user profile: ${JSON.stringify({ name: input.name, credits: input.credits })}`,
        });
      }

      return {
        success: true,
        userId: input.userId,
      };
    }),

  /**
   * Hide Game
   *
   * PRD Lines: 2095-2536
   *
   * Admin directly hides a game with a reason.
   * - Updates game status to 'hidden' and sets hidden fields
   * - Invalidates leaderboard cache for the game's theme
   * - Logs action to adminActions
   */
  hideGame: adminProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        reason: z.string().min(10).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify game exists
      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        with: {
          prompt: {
            columns: {
              themeId: true,
            },
          },
        },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      // PRD lines 511-519: Update game status to hidden
      await db
        .update(games)
        .set({
          status: "hidden",
          isHidden: true,
          hiddenReason: input.reason,
          hiddenAt: new Date(),
        })
        .where(eq(games.id, input.gameId));

      // PRD lines 521-527: Log to adminActions
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "hide_game",
        targetType: "game",
        targetId: input.gameId,
        reason: input.reason,
      });

      // PRD lines 529-533: Invalidate leaderboard cache
      if (game.prompt.themeId) {
        await redis.del(`lb:${game.prompt.themeId}`);
      }

      return {
        success: true,
        gameId: input.gameId,
      };
    }),

  /**
   * Unhide Game
   *
   * Admin directly unhides a previously hidden game.
   * - Updates game status from 'hidden' to 'completed'
   * - Clears hidden fields
   * - Logs action to adminActions
   */
  unhideGame: adminProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      await db
        .update(games)
        .set({
          status: "completed",
          isHidden: false,
          hiddenReason: null,
          hiddenAt: null,
        })
        .where(eq(games.id, input.gameId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "unhide_game",
        targetType: "game",
        targetId: input.gameId,
        reason: "Game unhidden by admin",
      });

      if (game.themeId) {
        await redis.del(`lb:${game.themeId}`);
      }

      return {
        success: true,
        gameId: input.gameId,
      };
    }),

  /**
   * Get Games
   *
   * List all games for admin management with filtering and pagination.
   */
  getGames: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        status: z.enum(["generating", "completed", "failed", "hidden"]).optional(),
        themeId: z.string().uuid().optional(),
        isSubmitted: z.boolean().optional(),
        isHidden: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const whereConditions: SQL[] = [];

      if (input.status) {
        whereConditions.push(eq(games.status, input.status));
      }
      if (input.themeId) {
        whereConditions.push(eq(games.themeId, input.themeId));
      }
      if (input.isSubmitted !== undefined) {
        whereConditions.push(eq(games.isSubmitted, input.isSubmitted));
      }
      if (input.isHidden !== undefined) {
        whereConditions.push(eq(games.isHidden, input.isHidden));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const gamesList = await db.query.games.findMany({
        where: whereClause,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(games.createdAt)],
        with: {
          prompt: {
            columns: {
              id: true,
              content: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          theme: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
      });

      return gamesList.map((game) => ({
        id: game.id,
        name: game.name,
        status: game.status,
        isHidden: game.isHidden,
        hiddenReason: game.hiddenReason,
        hiddenAt: game.hiddenAt,
        isSubmitted: game.isSubmitted,
        submittedAt: game.submittedAt,
        createdAt: game.createdAt,
        prompt: game.prompt
          ? {
              id: game.prompt.id,
              content: game.prompt.content,
              user: game.prompt.user
                ? {
                    id: game.prompt.user.id,
                    name: game.prompt.user.name,
                    email: game.prompt.user.email,
                    image: game.prompt.user.image,
                  }
                : null,
            }
          : null,
        theme: game.theme
          ? {
              id: game.theme.id,
              title: game.theme.title,
            }
          : null,
      }));
    }),

  /**
   * Suspend User
   *
   * PRD Lines: 2538-2563
   *
   * Admin suspends a user with a duration and reason.
   * - Duration options: 7d, 30d, permanent
   * - Logs action to adminActions with duration in metadata
   *
   * Note: Schema doesn't have a duration field, so duration is stored in metadata
   */
  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        reason: z.string().min(10).max(500),
        duration: z.enum(["7d", "30d", "permanent"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const targetUser = await db.query.userExtended.findFirst({
        where: eq(userExtended.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const now = new Date();
      let suspendedUntil: Date | null = null;

      if (input.duration === "7d") {
        suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (input.duration === "30d") {
        suspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await db
        .update(userExtended)
        .set({
          isSuspended: true,
          suspensionReason: input.reason,
          suspendedUntil,
        })
        .where(eq(userExtended.id, input.userId));

      // PRD lines 553-560: Log to adminActions with duration in metadata
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "suspend_user",
        targetType: "user",
        targetId: input.userId,
        reason: input.reason,
        metadata: JSON.stringify({
          duration: input.duration,
        }),
      });

      return {
        success: true,
        userId: input.userId,
        duration: input.duration,
      };
    }),

  /**
   * Unsuspend User
   *
   * Admin removes suspension from a user.
   * - Clears suspension fields
   * - Logs action to adminActions
   */
  unsuspendUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const targetUser = await db.query.userExtended.findFirst({
        where: eq(userExtended.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!targetUser.isSuspended) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not suspended",
        });
      }

      await db
        .update(userExtended)
        .set({
          isSuspended: false,
          suspensionReason: null,
          suspendedUntil: null,
        })
        .where(eq(userExtended.id, input.userId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "unsuspend_user",
        targetType: "user",
        targetId: input.userId,
        reason: "User unsuspended by admin",
      });

      return {
        success: true,
        userId: input.userId,
      };
    }),

  /**
   * Update Scoring Weights
   *
   * PRD Lines: 2469-2527
   *
   * Admin updates scoring weights for a theme.
   * - Uses upsert pattern (onConflictDoUpdate)
   * - Validates that weights sum to 1.0
   * - Logs action to adminActions
   * - Recalculates scores for all games in the theme
   */
  updateScoringWeights: adminProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        weights: z
          .object({
            quality: z.number().min(0).max(1),
            difficulty: z.number().min(0).max(1),
            efficiency: z.number().min(0).max(1),
            engagement: z.number().min(0).max(1),
            popularity: z.number().min(0).max(1),
          })
          .refine(
            (w) =>
              Math.abs(
                w.quality +
                  w.difficulty +
                  w.efficiency +
                  w.engagement +
                  w.popularity -
                  1.0,
              ) < 0.01,
            { message: "Weights must sum to 1.0" },
          ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // PRD lines 589-610: Upsert scoring weights
      await db
        .insert(scoringWeights)
        .values({
          themeId: input.themeId,
          qualityWeight: input.weights.quality.toFixed(2),
          difficultyWeight: input.weights.difficulty.toFixed(2),
          efficiencyWeight: input.weights.efficiency.toFixed(2),
          engagementWeight: input.weights.engagement.toFixed(2),
          popularityWeight: input.weights.popularity.toFixed(2),
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        })
        .onConflictDoUpdate({
          target: scoringWeights.themeId,
          set: {
            qualityWeight: input.weights.quality.toFixed(2),
            difficultyWeight: input.weights.difficulty.toFixed(2),
            efficiencyWeight: input.weights.efficiency.toFixed(2),
            engagementWeight: input.weights.engagement.toFixed(2),
            popularityWeight: input.weights.popularity.toFixed(2),
            updatedAt: new Date(),
            updatedBy: ctx.user.id,
          },
        });

      // PRD lines 612: Log to adminActions
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "update_scoring_weights",
        targetType: "theme",
        targetId: input.themeId,
        reason: `Updated scoring weights for theme`,
        metadata: JSON.stringify({
          oldWeights: "See previous version in database",
          newWeights: input.weights,
        }),
      });

      // Recalculate scores with new weights
      await recalculateThemeScores(input.themeId);

      return {
        success: true,
        themeId: input.themeId,
        weights: input.weights,
      };
    }),

  /**
   * Get Moderation Queue
   *
   * PRD Lines: 2095-2182
   *
   * Admin gets flagged content queue for severe cases.
   * - Similar to moderator getQueue but for admin access
   * - Returns pending moderation reports
   * - Filters by targetType optional
   */
  getModerationQueue: adminProcedure
    .input(
      z.object({
        targetType: z.enum(["prompt", "game", "user", "review"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const whereConditions: SQL[] = [eq(moderationReports.status, "pending")];
      if (input.targetType) {
        whereConditions.push(
          eq(moderationReports.targetType, input.targetType),
        );
      }

      const whereClause =
        whereConditions.length > 1
          ? and(...whereConditions)
          : whereConditions[0];

      return db.query.moderationReports.findMany({
        where: whereClause,
        orderBy: [asc(moderationReports.createdAt)],
        limit: input.limit,
        with: {
          reporter: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),
});
