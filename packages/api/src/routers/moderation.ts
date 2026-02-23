import { TRPCError } from "@trpc/server";
import { and, eq, ne, asc, desc, isNotNull, count, gte, sql, type SQL } from "drizzle-orm";
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

type GameStatus = "generating" | "completed" | "failed" | "hidden";
type PromptStatus = "draft" | "submitted" | "disqualified";

const validGameStatuses: GameStatus[] = ["generating", "completed", "failed", "hidden"];
const validPromptStatuses: PromptStatus[] = ["draft", "submitted", "disqualified"];

function parseGameStatus(status: string | undefined): GameStatus {
  if (status && validGameStatuses.includes(status as GameStatus)) {
    return status as GameStatus;
  }
  return "completed";
}

function parsePromptStatus(status: string | undefined): PromptStatus {
  if (status && validPromptStatuses.includes(status as PromptStatus)) {
    return status as PromptStatus;
  }
  return "draft";
}

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
   * AM-014: Added priority sorting - reports sorted by severity and age
   */
  getQueue: moderatorProcedure
    .input(
      z.object({
        targetType: targetTypeFilter,
        limit: z.number().int().min(1).max(100).default(50),
        sortByPriority: z.boolean().default(true),
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

      const reports = await db.query.moderationReports.findMany({
        where: whereClause,
        orderBy: input.sortByPriority
          ? [
              desc(
                sql`CASE 
                  WHEN ${moderationReports.reason} = 'malicious' THEN 1
                  WHEN ${moderationReports.reason} = 'harassment' THEN 2
                  WHEN ${moderationReports.reason} = 'inappropriate' THEN 3
                  WHEN ${moderationReports.reason} = 'spam' THEN 4
                  WHEN ${moderationReports.reason} = 'copyright' THEN 5
                  ELSE 6
                END`,
              ),
              asc(moderationReports.createdAt),
            ]
          : [asc(moderationReports.createdAt)],
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

      if (input.sortByPriority) {
        const reportsWithPriority = reports.map((report) => {
          let priority: "critical" | "high" | "medium" | "low" = "low";
          const ageInHours =
            (Date.now() - (report.createdAt?.getTime() ?? 0)) / (1000 * 60 * 60);

          if (report.reason === "malicious" || report.reason === "harassment") {
            priority = ageInHours > 24 ? "critical" : "high";
          } else if (report.reason === "inappropriate") {
            priority = ageInHours > 48 ? "high" : "medium";
          } else if (report.reason === "spam") {
            priority = ageInHours > 72 ? "medium" : "low";
          } else {
            priority = ageInHours > 72 ? "medium" : "low";
          }

          return { ...report, priority };
        });

        return reportsWithPriority;
      }

      return reports;
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
      // Wrap all database operations in a transaction for atomicity
      await db.transaction(async (tx) => {
        await tx
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
            const gameBefore = await tx.query.games.findFirst({
              where: eq(games.id, report.targetId),
              columns: { status: true, themeId: true },
            });
            const originalStatus = gameBefore?.status ?? "completed";

            await tx
              .update(games)
              .set({
                status: "hidden",
                isHidden: true,
                hiddenAt: new Date(),
                hiddenReason: `Moderation: ${input.resolutionReason}`,
              })
              .where(eq(games.id, report.targetId));

            await tx
              .update(moderationReports)
              .set({
                resolutionNotes: JSON.stringify({
                  reason: input.resolutionReason,
                  originalStatus,
                }),
              })
              .where(eq(moderationReports.id, input.reportId));

            if (gameBefore?.themeId) {
              await redis.del(`lb:${gameBefore.themeId}`);
            }
          } else if (report.targetType === "prompt" && report.targetId) {
            const promptBefore = await tx.query.prompts.findFirst({
              where: eq(prompts.id, report.targetId),
              columns: { status: true },
            });
            const originalStatus = promptBefore?.status ?? "draft";

            await tx
              .update(prompts)
              .set({
                status: "disqualified",
              })
              .where(eq(prompts.id, report.targetId));

            await tx
              .update(moderationReports)
              .set({
                resolutionNotes: JSON.stringify({
                  reason: input.resolutionReason,
                  originalStatus,
                }),
              })
              .where(eq(moderationReports.id, input.reportId));
          } else if (report.targetType === "user" && report.targetId) {
            await tx
              .update(userExtended)
              .set({
                isSuspended: true,
                suspensionReason: input.resolutionReason,
              })
              .where(eq(userExtended.id, report.targetId));
          } else if (report.targetType === "review" && report.targetId) {
            await tx.delete(ratings).where(eq(ratings.id, report.targetId));
            await redis.del(`lb:*`);
          }
        } else if (input.action === "escalated") {
          await redis.xadd(
            "admin:escalation",
            "*",
            "reportId",
            input.reportId,
            "escalatedBy",
            userId,
          );
        }

        const userRole = ctx.user!.role;
        await tx.insert(adminActions).values({
          adminId: userId,
          actionType: "resolve_report",
          targetType: report.targetType,
          targetId: report.targetId,
          reason: input.resolutionReason,
          metadata: JSON.stringify({
            resolutionAction: input.action,
            reportId: input.reportId,
            resolvedByRole: userRole,
          }),
        });
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

      if (report.targetType === "user" && report.targetId) {
        const targetUser = await db.query.userExtended.findFirst({
          where: eq(userExtended.id, report.targetId),
          columns: { isSuspended: true },
        });
        if (!targetUser?.isSuspended) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot appeal: user is not currently suspended",
          });
        }
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
        let parsedNotes: { reason?: string; originalStatus?: string } | null = null;
        try {
          parsedNotes = JSON.parse(appeal.report.resolutionNotes);
        } catch {
          parsedNotes = null;
        }

        if (appeal.report.targetType === "game" && appeal.report.targetId) {
          const restoredStatus = parseGameStatus(parsedNotes?.originalStatus);
          await db
            .update(games)
            .set({
              status: restoredStatus,
              isHidden: false,
              hiddenAt: null,
              hiddenReason: null,
            })
            .where(eq(games.id, appeal.report.targetId));

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
          const restoredStatus = parsePromptStatus(parsedNotes?.originalStatus);
          await db
            .update(prompts)
            .set({
              status: restoredStatus,
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

      const userRole = ctx.user!.role;
      await db.insert(adminActions).values({
        adminId: userId,
        actionType: "resolve_appeal",
        targetType: "appeal",
        targetId: input.appealId,
        reason: input.response,
        metadata: JSON.stringify({
          appealStatus: input.status,
          originalReportId: appeal.reportId,
          resolvedByRole: userRole,
        }),
      });

      return { success: true };
    }),

  /**
   * Get Moderator Stats
   *
   * AM-013: Moderator statistics endpoint
   *
   * Returns statistics for a moderator or all moderators.
   */
  getModeratorStats: moderatorProcedure
    .input(
      z.object({
        moderatorId: z.string().optional(),
        days: z.number().int().min(1).max(90).default(30),
      }),
    )
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const moderatorFilter = input.moderatorId
        ? eq(adminActions.adminId, input.moderatorId)
        : undefined;

      const [
        resolvedReports,
        resolvedAppeals,
        escalatedReports,
        avgResolutionTime,
      ] = await Promise.all([
        db
          .select({
            adminId: adminActions.adminId,
            count: count(),
          })
          .from(adminActions)
          .where(
            and(
              eq(adminActions.actionType, "resolve_report"),
              gte(adminActions.createdAt, startDate),
              moderatorFilter,
            ),
          )
          .groupBy(adminActions.adminId),
        db
          .select({
            adminId: adminActions.adminId,
            count: count(),
          })
          .from(adminActions)
          .where(
            and(
              eq(adminActions.actionType, "resolve_appeal"),
              gte(adminActions.createdAt, startDate),
              moderatorFilter,
            ),
          )
          .groupBy(adminActions.adminId),
        db
          .select({
            adminId: adminActions.adminId,
            count: count(),
          })
          .from(adminActions)
          .where(
            and(
              eq(adminActions.actionType, "resolve_report"),
              sql`${adminActions.metadata}::jsonb->>'resolutionAction' = 'escalated'`,
              gte(adminActions.createdAt, startDate),
              moderatorFilter,
            ),
          )
          .groupBy(adminActions.adminId),
        db
          .select({
            adminId: adminActions.adminId,
            avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${moderationReports.reviewedAt} - ${moderationReports.createdAt})) / 3600)`,
          })
          .from(moderationReports)
          .innerJoin(
            adminActions,
            and(
              eq(adminActions.targetId, moderationReports.id),
              eq(adminActions.actionType, "resolve_report"),
            ),
          )
          .where(
            and(
              eq(moderationReports.status, "resolved"),
              gte(moderationReports.reviewedAt, startDate),
              moderatorFilter,
            ),
          )
          .groupBy(adminActions.adminId),
      ]);

      const statsMap = new Map<
        string,
        {
          resolvedReports: number;
          resolvedAppeals: number;
          escalatedReports: number;
          avgResolutionTimeHours: number | null;
        }
      >();

      for (const r of resolvedReports) {
        const existing = statsMap.get(r.adminId) ?? {
          resolvedReports: 0,
          resolvedAppeals: 0,
          escalatedReports: 0,
          avgResolutionTimeHours: null,
        };
        existing.resolvedReports = r.count;
        statsMap.set(r.adminId, existing);
      }

      for (const r of resolvedAppeals) {
        const existing = statsMap.get(r.adminId) ?? {
          resolvedReports: 0,
          resolvedAppeals: 0,
          escalatedReports: 0,
          avgResolutionTimeHours: null,
        };
        existing.resolvedAppeals = r.count;
        statsMap.set(r.adminId, existing);
      }

      for (const r of escalatedReports) {
        const existing = statsMap.get(r.adminId) ?? {
          resolvedReports: 0,
          resolvedAppeals: 0,
          escalatedReports: 0,
          avgResolutionTimeHours: null,
        };
        existing.escalatedReports = r.count;
        statsMap.set(r.adminId, existing);
      }

      for (const r of avgResolutionTime) {
        const existing = statsMap.get(r.adminId);
        if (existing) {
          existing.avgResolutionTimeHours = r.avgTime;
        }
      }

      const [pendingReportsCount, pendingAppealsCount] = await Promise.all([
        db
          .select({ count: count() })
          .from(moderationReports)
          .where(eq(moderationReports.status, "pending")),
        db
          .select({ count: count() })
          .from(moderationAppeals)
          .where(eq(moderationAppeals.status, "pending")),
      ]);

      return {
        period: { start: startDate, end: new Date(), days: input.days },
        moderatorId: input.moderatorId,
        stats: Object.fromEntries(statsMap),
        queueStatus: {
          pendingReports: pendingReportsCount[0]?.count ?? 0,
          pendingAppeals: pendingAppealsCount[0]?.count ?? 0,
        },
      };
    }),

  /**
   * Escalate to Admin
   *
   * AM-017: Moderation escalation path
   *
   * Allows moderators to escalate reports that require admin attention.
   * - Notifies admins via Redis Stream
   * - Sets report status to escalated
   */
  escalateToAdmin: moderatorProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        escalationReason: z.string().min(20).max(500),
        urgencyLevel: z.enum(["normal", "urgent", "critical"]).default("normal"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      if (report.status !== "pending" && report.status !== "reviewing") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only escalate pending or reviewing reports",
        });
      }

      const userId = ctx.user!.id;

      await db
        .update(moderationReports)
        .set({
          status: "reviewing",
          resolutionNotes: JSON.stringify({
            escalated: true,
            escalationReason: input.escalationReason,
            urgencyLevel: input.urgencyLevel,
            escalatedBy: userId,
            escalatedAt: new Date().toISOString(),
          }),
        })
        .where(eq(moderationReports.id, input.reportId));

      await redis.xadd(
        "admin:escalation",
        "*",
        "reportId",
        input.reportId,
        "escalatedBy",
        userId,
        "urgencyLevel",
        input.urgencyLevel,
        "reason",
        input.escalationReason,
      );

      await db.insert(adminActions).values({
        adminId: userId,
        actionType: "escalate_to_admin",
        targetType: report.targetType,
        targetId: report.targetId,
        reason: input.escalationReason,
        metadata: JSON.stringify({
          reportId: input.reportId,
          urgencyLevel: input.urgencyLevel,
        }),
      });

      return {
        success: true,
        reportId: input.reportId,
        urgencyLevel: input.urgencyLevel,
      };
    }),

  /**
   * Check Appeal Deadline
   *
   * AM-016: Appeal deadline handling
   *
   * Checks if an appeal is within the allowed deadline period.
   * Also returns deadline status for pending appeals.
   */
  checkAppealDeadline: moderatorProcedure
    .input(
      z.object({
        appealId: z.string().uuid().optional(),
        includeExpired: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const APPEAL_DEADLINE_DAYS = 14;

      if (input.appealId) {
        const appeal = await db.query.moderationAppeals.findFirst({
          where: eq(moderationAppeals.id, input.appealId),
          with: {
            report: {
              columns: {
                id: true,
                reviewedAt: true,
                status: true,
              },
            },
          },
        });

        if (!appeal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Appeal not found",
          });
        }

        const reportReviewedAt = appeal.report.reviewedAt;
        const deadline = reportReviewedAt
          ? new Date(reportReviewedAt.getTime() + APPEAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
          : null;

        const isWithinDeadline = deadline
          ? new Date() <= deadline
          : false;

        const daysRemaining = deadline
          ? Math.max(
              0,
              Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
            )
          : null;

        return {
          appealId: appeal.id,
          status: appeal.status,
          reportReviewedAt,
          deadline,
          isWithinDeadline,
          daysRemaining,
          isExpired: !isWithinDeadline,
        };
      }

      const appealsQuery = db.query.moderationAppeals.findMany({
        where: eq(moderationAppeals.status, "pending"),
        with: {
          report: {
            columns: {
              id: true,
              reviewedAt: true,
              status: true,
            },
          },
        },
      });

      const appeals = await appealsQuery;

      const appealsWithDeadlines = appeals.map((appeal) => {
        const reportReviewedAt = appeal.report.reviewedAt;
        const deadline = reportReviewedAt
          ? new Date(reportReviewedAt.getTime() + APPEAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
          : null;

        const isWithinDeadline = deadline
          ? new Date() <= deadline
          : false;

        const daysRemaining = deadline
          ? Math.max(
              0,
              Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
            )
          : null;

        return {
          appealId: appeal.id,
          reportId: appeal.reportId,
          reportReviewedAt,
          deadline,
          isWithinDeadline,
          daysRemaining,
          isExpired: !isWithinDeadline,
        };
      });

      if (!input.includeExpired) {
        return appealsWithDeadlines.filter((a) => !a.isExpired);
      }

      return appealsWithDeadlines;
    }),

  /**
   * Get Escalation Queue
   *
   * AM-017: Get escalated reports for admin review
   *
   * Returns all reports that have been escalated to admins.
   */
  getEscalationQueue: moderatorProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const escalatedActions = await db.query.adminActions.findMany({
        where: eq(adminActions.actionType, "escalate_to_admin"),
        orderBy: [desc(adminActions.createdAt)],
        limit: input.limit,
        with: {
          admin: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const escalatedReportIds = escalatedActions
        .map((action) => {
          if (action.metadata) {
            try {
              const parsed = JSON.parse(action.metadata) as { reportId?: string };
              return parsed.reportId;
            } catch {
              return null;
            }
          }
          return null;
        })
        .filter((id): id is string => id !== null);

      const reports = await db.query.moderationReports.findMany({
        where: and(
          eq(moderationReports.status, "reviewing"),
          ...escalatedReportIds.map((id) => eq(moderationReports.id, id)),
        ),
        with: {
          reporter: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const reportMap = new Map(reports.map((r) => [r.id, r]));

      return escalatedActions.map((action) => {
        let metadata: { reportId?: string; urgencyLevel?: string } = {};
        if (action.metadata) {
          try {
            metadata = JSON.parse(action.metadata) as { reportId?: string; urgencyLevel?: string };
          } catch {
            metadata = {};
          }
        }

        const report = metadata.reportId ? reportMap.get(metadata.reportId) : null;

        return {
          escalationId: action.id,
          escalatedBy: action.admin,
          escalatedAt: action.createdAt,
          urgencyLevel: (metadata.urgencyLevel as "normal" | "urgent" | "critical") ?? "normal",
          report: report
            ? {
                id: report.id,
                targetType: report.targetType,
                reason: report.reason,
                description: report.description,
                createdAt: report.createdAt,
                reporter: report.reporter,
              }
            : null,
        };
      });
    }),
});
