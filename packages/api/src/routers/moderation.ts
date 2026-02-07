import { TRPCError } from "@trpc/server";
import { and, eq, ne, asc, desc, isNotNull, type SQL } from "drizzle-orm";
import { z } from "zod";

import { db } from "@arcade-vibe/db";
import {
  moderationReports,
  moderationAppeals,
} from "@arcade-vibe/db/schema/moderation";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { redis } from "@arcade-vibe/api/lib/redis";

import { router, protectedProcedure, moderatorProcedure } from "../index";

/**
 * Moderation Router
 *
 * PRD Reference: Lines 1728-2093
 *
 * Handles user reports, moderator queue, report resolution, and appeals.
 */

// Note: moderationTargetTypeEnum includes "prompt", "game", "user", "review"
const targetTypeFilter = z
  .enum(["prompt", "game", "user", "review"])
  .optional();

export const moderationRouter = router({
  /**
   * Submit Report
   *
   * PRD Lines: 1729-1768
   *
   * User submits a report for content moderation.
   * - Checks for duplicate reports from same user
   * - Notifies moderators via Redis Stream
   */
  submitReport: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["prompt", "game", "user", "review"]),
        targetId: z.string().uuid(),
        reason: z.enum([
          "inappropriate",
          "spam",
          "malicious",
          "copyright",
          "harassment",
          "other",
        ]),
        description: z.string().min(20).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // protectedProcedure guarantees user exists
      const userId = ctx.user!.id;

      // PRD lines 185-199: Check for duplicate reports
      const existing = await db.query.moderationReports.findFirst({
        where: and(
          eq(moderationReports.reporterId, userId),
          eq(moderationReports.targetType, input.targetType),
          isNotNull(moderationReports.targetId),
          eq(moderationReports.targetId, input.targetId),
          eq(moderationReports.status, "pending"),
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending report for this item.",
        });
      }

      // PRD lines 202-205: Insert report
      const report = await db
        .insert(moderationReports)
        .values({
          reporterId: userId,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          description: input.description,
        })
        .returning();

      // PRD lines 207-210: Notify moderators via Redis Stream
      if (report[0]) {
        await redis.xadd(
          "moderation:new",
          "*",
          "reportId",
          report[0].id,
          "targetType",
          input.targetType,
        );

        return report[0];
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create report",
      });
    }),

  /**
   * Get Queue
   *
   * PRD Lines: 1771-1793
   *
   * Moderator gets pending reports with optional targetType filter.
   */
  getQueue: moderatorProcedure
    .input(
      z.object({
        targetType: targetTypeFilter,
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      // PRD lines 225-227: Build where clause
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

      // PRD lines 229-237: Query reports with reporter and reviewer
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

  /**
   * Get Report Details
   *
   * PRD Lines: 1796-1857
   *
   * Moderator gets report details including:
   * - Target content
   * - Flag history for the same target
   */
  getReport: moderatorProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      // PRD lines 247-253: Get report with reporter and reviewer
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
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

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      // PRD lines 259-281: Fetch target content based on type
      // Note: Schema only supports "prompt", "game", "user"
      let targetContent: unknown = null;
      if (report.targetType === "game" && report.targetId) {
        targetContent = await db.query.games.findFirst({
          where: eq(games.id, report.targetId),
          with: {
            prompt: {
              columns: {
                content: true,
              },
            },
          },
        });
      } else if (report.targetType === "prompt" && report.targetId) {
        targetContent = await db.query.prompts.findFirst({
          where: eq(prompts.id, report.targetId),
          columns: {
            content: true,
          },
        });
      } else if (report.targetType === "user" && report.targetId) {
        targetContent = await db.query.userExtended.findFirst({
          where: eq(userExtended.id, report.targetId),
          columns: {
            id: true,
            credits: true,
            isSuspended: true,
          },
        });
      }

      // PRD lines 283-292: Fetch flag history
      const flagHistory = await db.query.moderationReports.findMany({
        where: and(
          eq(moderationReports.targetType, report.targetType),
          isNotNull(moderationReports.targetId),
          eq(moderationReports.targetId, report.targetId ?? ""),
          ne(moderationReports.id, report.id),
        ),
        orderBy: [desc(moderationReports.createdAt)],
        with: {
          reporter: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { report, targetContent, flagHistory };
    }),

  /**
   * Resolve Report
   *
   * PRD Lines: 1860-1947
   *
   * Moderator resolves a report with an action:
   * - approved: Hide game, disqualify prompt, suspend user
   * - rejected: No action needed
   * - requested_changes: No action needed
   * - escalated: Notify admin via Redis
   */
  resolveReport: moderatorProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        action: z.enum([
          "approved",
          "rejected",
          "requested_changes",
          "escalated",
        ]),
        resolutionReason: z.string().min(20).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // PRD lines 308-314: Get report
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      // moderatorProcedure guarantees user is defined
      const userId = ctx.user!.id;

      // PRD lines 316-325: Update report status
      await db
        .update(moderationReports)
        .set({
          status: "resolved",
          resolutionNotes: input.resolutionReason, // Schema uses resolutionNotes, not resolutionReason
          reviewedBy: userId, // Schema uses reviewedBy, not assignedTo
          reviewedAt: new Date(),
        })
        .where(eq(moderationReports.id, input.reportId));

      // PRD lines 327-363: Execute action based on resolution
      if (input.action === "approved") {
        if (report.targetType === "game" && report.targetId) {
          // PRD lines 329-344: Hide game
          await db
            .update(games)
            .set({
              status: "hidden",
              isHidden: true,
              hiddenAt: new Date(),
              hiddenReason: `Moderation: ${input.resolutionReason}`,
            })
            .where(eq(games.id, report.targetId));

          // PRD line 344: Invalidate theme leaderboard cache
          const game = await db.query.games.findFirst({
            where: eq(games.id, report.targetId),
            columns: {
              themeId: true,
            },
          });

          if (game?.themeId) {
            await redis.del(`lb:${game.themeId}`);
          }
        } else if (report.targetType === "prompt" && report.targetId) {
          // PRD lines 345-349: Disqualify prompt
          await db
            .update(prompts)
            .set({
              status: "disqualified",
            })
            .where(eq(prompts.id, report.targetId));
        } else if (report.targetType === "user" && report.targetId) {
          // PRD lines 350-354: Suspend user
          await db
            .update(userExtended)
            .set({
              isSuspended: true,
              suspensionReason: input.resolutionReason,
            })
            .where(eq(userExtended.id, report.targetId));
        } else if (report.targetType === "review" && report.targetId) {
          // Delete the rating/review
          await db.delete(ratings).where(eq(ratings.id, report.targetId));
          // Invalidate cache
          await redis.del(`lb:*`);
        }
      } else if (input.action === "escalated") {
        // PRD lines 358-363: Notify admin via Redis
        await redis.xadd(
          "admin:escalation",
          "*",
          "reportId",
          input.reportId,
          "escalatedBy",
          userId,
        );
      }

      // PRD lines 365-372: Log to adminActions
      await db.insert(adminActions).values({
        adminId: userId,
        actionType: "resolve_report",
        targetType: report.targetType,
        targetId: report.targetId,
        reason: input.resolutionReason,
        metadata: JSON.stringify({
          resolutionAction: input.action,
          reportId: input.reportId,
        }),
      });

      return { success: true };
    }),

  /**
   * Appeal Resolution
   *
   * PRD Lines: 1950-2004
   *
   * Content owner appeals a resolved report.
   * - Validates ownership of the target content
   * - Creates appeal with reason
   * - Notifies moderators via Redis Stream
   */
  appealResolution: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        reason: z.string().min(50).max(2000), // Schema uses reason, not message
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // protectedProcedure guarantees user exists
      const userId = ctx.user!.id;

      // PRD lines 387-392: Get report
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report || report.status !== "resolved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only appeal resolved reports",
        });
      }

      // PRD lines 395-418: Check if user can appeal (must be content owner)
      // Note: prompt.authorId is uuid type, not text
      let canAppeal = false;
      if (report.targetType === "game" && report.targetId) {
        const game = await db.query.games.findFirst({
          where: eq(games.id, report.targetId),
          with: {
            prompt: {
              columns: {
                authorId: true,
              },
            },
          },
        });
        canAppeal = game?.prompt.authorId === userId;
      } else if (report.targetType === "prompt" && report.targetId) {
        const prompt = await db.query.prompts.findFirst({
          where: eq(prompts.id, report.targetId),
        });
        canAppeal = prompt?.authorId === userId;
      } else if (report.targetType === "user" && report.targetId) {
        canAppeal = report.targetId === userId;
      }

      if (!canAppeal) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only appeal if you are the content owner",
        });
      }

      // PRD lines 421-425: Insert appeal
      const appeal = await db
        .insert(moderationAppeals)
        .values({
          reportId: input.reportId,
          appellantId: userId,
          reason: input.reason,
        })
        .returning();

      // PRD lines 427-430: Notify moderators via Redis Stream
      if (appeal[0]) {
        await redis.xadd(
          "moderation:appeal",
          "*",
          "appealId",
          appeal[0].id,
          "reportId",
          input.reportId,
        );

        return appeal[0];
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create appeal",
      });
    }),

  /**
   * Get Appeals
   *
   * PRD Lines: 2007-2024 (mentioned in requirements)
   *
   * Moderator gets pending appeals.
   */
  getAppeals: moderatorProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      return db.query.moderationAppeals.findMany({
        where: eq(moderationAppeals.status, "pending"),
        orderBy: [asc(moderationAppeals.createdAt)],
        limit: input.limit,
        with: {
          appellant: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          report: {
            columns: {
              id: true,
              targetType: true,
              targetId: true,
              resolutionNotes: true,
            },
          },
        },
      });
    }),

  /**
   * Resolve Appeal
   *
   * PRD Lines: 2027-2091
   *
   * Moderator resolves an appeal.
   * - If approved, reverts original resolution
   * - Logs to adminActions
   */
  resolveAppeal: moderatorProcedure
    .input(
      z.object({
        appealId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        response: z.string().min(20).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // PRD lines 446-452: Get appeal with report
      const appeal = await db.query.moderationAppeals.findFirst({
        where: eq(moderationAppeals.id, input.appealId),
        with: {
          report: true,
        },
      });

      if (!appeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appeal not found",
        });
      }

      // moderatorProcedure guarantees user is defined
      const userId = ctx.user!.id;

      // PRD lines 455-463: Update appeal status
      await db
        .update(moderationAppeals)
        .set({
          status: input.status,
          decisionNotes: input.response, // Schema uses decisionNotes, not response
          reviewedBy: userId,
          reviewedAt: new Date(),
        })
        .where(eq(moderationAppeals.id, input.appealId));

      // PRD lines 465-483: If approved, revert original resolution
      if (input.status === "approved" && appeal.report.resolutionNotes) {
        // Only revert if there was an approved action
        if (appeal.report.targetType === "game" && appeal.report.targetId) {
          await db
            .update(games)
            .set({
              status: "completed",
              isHidden: false,
              hiddenAt: null,
              hiddenReason: null,
            })
            .where(eq(games.id, appeal.report.targetId));

          // Invalidate cache
          const game = await db.query.games.findFirst({
            where: eq(games.id, appeal.report.targetId),
            columns: {
              themeId: true,
            },
          });

          if (game?.themeId) {
            await redis.del(`lb:${game.themeId}`);
          }
        } else if (
          appeal.report.targetType === "prompt" &&
          appeal.report.targetId
        ) {
          await db
            .update(prompts)
            .set({
              status: "draft",
            })
            .where(eq(prompts.id, appeal.report.targetId));
        } else if (
          appeal.report.targetType === "user" &&
          appeal.report.targetId
        ) {
          await db
            .update(userExtended)
            .set({
              isSuspended: false,
              suspensionReason: null,
            })
            .where(eq(userExtended.id, appeal.report.targetId));
        }
      }

      // PRD lines 485-492: Log to adminActions
      await db.insert(adminActions).values({
        adminId: userId,
        actionType: "resolve_appeal",
        targetType: "appeal",
        targetId: input.appealId,
        reason: input.response,
        metadata: JSON.stringify({
          appealStatus: input.status,
          originalReportId: appeal.reportId,
        }),
      });

      return { success: true };
    }),
});
