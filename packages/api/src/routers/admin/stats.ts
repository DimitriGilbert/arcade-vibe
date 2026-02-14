import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { adminActions, platformStats } from "@arcade-vibe/db/schema/platform";
import { user } from "@arcade-vibe/db/schema/auth";
import { z } from "zod";
import { eq, and, gte, lte, desc, count, type SQL } from "drizzle-orm";

export const statsRouter = router({
  getStats: adminProcedure.query(async () => {
    const stats = await db.query.platformStats.findFirst({
      orderBy: desc(platformStats.lastCalculatedAt),
    });

    if (!stats) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPrompts: 0,
        totalGames: 0,
        totalRatings: 0,
        averageRating: "0",
        lastCalculatedAt: null,
      };
    }

    return {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      totalPrompts: stats.totalPrompts,
      totalGames: stats.totalGames,
      totalRatings: stats.totalRatings,
      averageRating: stats.averageRating,
      lastCalculatedAt: stats.lastCalculatedAt,
    };
  }),

  getActions: adminProcedure
    .input(
      z.object({
        adminId: z.string().optional(),
        actionType: z.string().optional(),
        targetType: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const whereConditions: SQL[] = [];

      if (input.adminId) {
        whereConditions.push(eq(adminActions.adminId, input.adminId));
      }
      if (input.actionType) {
        whereConditions.push(eq(adminActions.actionType, input.actionType));
      }
      if (input.targetType) {
        whereConditions.push(eq(adminActions.targetType, input.targetType));
      }
      if (input.startDate) {
        whereConditions.push(gte(adminActions.createdAt, input.startDate));
      }
      if (input.endDate) {
        whereConditions.push(lte(adminActions.createdAt, input.endDate));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [actions, totalResult] = await Promise.all([
        db
          .select({
            id: adminActions.id,
            adminId: adminActions.adminId,
            adminName: user.name,
            actionType: adminActions.actionType,
            targetType: adminActions.targetType,
            targetId: adminActions.targetId,
            reason: adminActions.reason,
            metadata: adminActions.metadata,
            createdAt: adminActions.createdAt,
          })
          .from(adminActions)
          .leftJoin(user, eq(adminActions.adminId, user.id))
          .where(whereClause)
          .orderBy(desc(adminActions.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: count() })
          .from(adminActions)
          .where(whereClause),
      ]);

      return {
        actions: actions.map((action) => ({
          id: action.id,
          adminId: action.adminId,
          adminName: action.adminName ?? "Unknown",
          actionType: action.actionType,
          targetType: action.targetType,
          targetId: action.targetId,
          reason: action.reason,
          metadata: action.metadata,
          createdAt: action.createdAt,
        })),
        total: totalResult[0]?.count ?? 0,
      };
    }),
});