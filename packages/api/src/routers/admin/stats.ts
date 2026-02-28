import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { adminActions } from "@arcade-vibe/db/schema/platform";
// import { platformStats } from "@arcade-vibe/db/schema/platform"; // Uncomment for cached stats
import { user, session } from "@arcade-vibe/db/schema/auth";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { games } from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { recalculateAllScores } from "../../lib/scoring";
import { z } from "zod";
import { eq, and, gte, lte, desc, count, avg, sql, type SQL } from "drizzle-orm";

export const statsRouter = router({
  getStats: adminProcedure.query(async () => {
    // ========================================
    // ON-DEMAND STATS (Dev/Beta)
    // ========================================
    // This queries actual table counts directly for real-time stats.
    // Switch to cached version below for production (better performance at scale).
    
    const now = new Date();

    const [
      totalUsersResult,
      activeUsersResult,
      totalPromptsResult,
      totalGamesResult,
      totalRatingsResult,
      averageRatingResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(user),
      db
        .select({ count: count() })
        .from(user)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${session} 
            WHERE ${session.userId} = ${user.id} 
            AND ${session.expiresAt} > ${now}
          )`,
        ),
      db.select({ count: count() }).from(prompts),
      db.select({ count: count() }).from(games),
      db.select({ count: count() }).from(ratings),
      db.select({ avg: avg(ratings.overall) }).from(ratings),
    ]);

    return {
      totalUsers: totalUsersResult[0]?.count ?? 0,
      activeUsers: activeUsersResult[0]?.count ?? 0,
      totalPrompts: totalPromptsResult[0]?.count ?? 0,
      totalGames: totalGamesResult[0]?.count ?? 0,
      totalRatings: totalRatingsResult[0]?.count ?? 0,
      averageRating: averageRatingResult[0]?.avg?.toString() ?? "0",
      lastCalculatedAt: now,
    };

    // ========================================
    // CACHED STATS (Production)
    // ========================================
    // Uncomment this block and comment out the on-demand version above
    // when switching to production. Run `pnpm run update-platform-stats`
    // as a cron job to keep the platform_stats table updated.
    //
    // const stats = await db.query.platformStats.findFirst({
    //   orderBy: desc(platformStats.lastCalculatedAt),
    // });
    //
    // if (!stats) {
    //   return {
    //     totalUsers: 0,
    //     activeUsers: 0,
    //     totalPrompts: 0,
    //     totalGames: 0,
    //     totalRatings: 0,
    //     averageRating: "0",
    //     lastCalculatedAt: null,
    //   };
    // }
    //
    // return {
    //   totalUsers: stats.totalUsers,
    //   activeUsers: stats.activeUsers,
    //   totalPrompts: stats.totalPrompts,
    //   totalGames: stats.totalGames,
    //   totalRatings: stats.totalRatings,
    //   averageRating: stats.averageRating,
    //   lastCalculatedAt: stats.lastCalculatedAt,
    // };
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

  recalculateAllScores: adminProcedure
    .mutation(async ({ ctx }) => {
      const result = await recalculateAllScores();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "recalculate_scores",
        targetType: "platform",
        targetId: null,
        reason: "Manual full score recalculation",
        metadata: JSON.stringify({
          totalGames: result.totalGames,
          successful: result.successful,
          failed: result.failed,
        }),
      });

      return result;
    }),
});
