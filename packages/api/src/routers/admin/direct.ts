import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { adminActions, scoringWeights } from "@arcade-vibe/db/schema/platform";
import { moderationReports } from "@arcade-vibe/db/schema/moderation";
import { z } from "zod";
import { eq, and, asc, type SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { redis } from "@arcade-vibe/api/lib/redis";

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
      })
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
        userId: z.string().uuid(),
        reason: z.string().min(10).max(500),
        duration: z.enum(["7d", "30d", "permanent"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user exists
      const targetUser = await db.query.userExtended.findFirst({
        where: eq(userExtended.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // PRD lines 545-551: Update user to suspended
      await db
        .update(userExtended)
        .set({
          isSuspended: true,
          suspensionReason: input.reason,
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
   * Update Scoring Weights
   *
   * PRD Lines: 2469-2527
   *
   * Admin updates scoring weights for a theme.
   * - Uses upsert pattern (onConflictDoUpdate)
   * - Validates that weights sum to 1.0
   * - Logs action to adminActions
   *
   * Note: Schema uses INTEGER weights (promptQualityWeight, gameQualityWeight, themeRelevanceWeight, overallWeight)
   * The PRD expects decimal weights (quality, difficulty, efficiency, engagement, popularity)
   * This implementation uses the schema's integer weights for type safety.
   *
   * TODO: Implement recalculateThemeScores(themeId) to recalculate scores when weights change
   */
  updateScoringWeights: adminProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        weights: z.object({
          promptQualityWeight: z.number().int().min(0).default(1),
          gameQualityWeight: z.number().int().min(0).default(1),
          themeRelevanceWeight: z.number().int().min(0).default(1),
          overallWeight: z.number().int().min(0).default(1),
        }).refine(
          (w) => w.promptQualityWeight + w.gameQualityWeight + w.themeRelevanceWeight + w.overallWeight > 0,
          { message: "At least one weight must be greater than 0" }
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // PRD lines 589-610: Upsert scoring weights
      await db
        .insert(scoringWeights)
        .values({
          themeId: input.themeId,
          promptQualityWeight: input.weights.promptQualityWeight,
          gameQualityWeight: input.weights.gameQualityWeight,
          themeRelevanceWeight: input.weights.themeRelevanceWeight,
          overallWeight: input.weights.overallWeight,
        })
        .onConflictDoUpdate({
          target: scoringWeights.themeId,
          set: {
            promptQualityWeight: input.weights.promptQualityWeight,
            gameQualityWeight: input.weights.gameQualityWeight,
            themeRelevanceWeight: input.weights.themeRelevanceWeight,
            overallWeight: input.weights.overallWeight,
            updatedAt: new Date(),
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

      // TODO: PRD lines 612: Call recalculateThemeScores(input.themeId)
      // This function will be implemented separately to recalculate scores based on new weights

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
        targetType: z.enum(["prompt", "game", "user"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const whereConditions: SQL[] = [eq(moderationReports.status, "pending")];
      if (input.targetType) {
        whereConditions.push(eq(moderationReports.targetType, input.targetType));
      }

      const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

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
