import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { user, session } from "@arcade-vibe/db/schema/auth";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { creditTransactions } from "@arcade-vibe/db/schema/credits";
import { emailLogs } from "@arcade-vibe/db/schema/email";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import {
  eq,
  and,
  or,
  gte,
  lte,
  desc,
  count,
  sql,
  type SQL,
  inArray,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  sendBatchEmails,
  getBroadcastEmailHtml,
} from "@arcade-vibe/email";
import { randomUUID } from "node:crypto";

// ========================================
// Schemas
// ========================================

const UserFilterSchema = z.object({
  // Role filter
  role: z.enum(["admin", "moderator", "participant", "viewer"]).optional(),

  // Activity filters
  minGames: z.number().int().min(0).optional(),
  maxGames: z.number().int().min(0).optional(),
  minPrompts: z.number().int().min(0).optional(),
  maxPrompts: z.number().int().min(0).optional(),

  // Credit filters
  minCredits: z.number().int().min(0).optional(),
  maxCredits: z.number().int().min(0).optional(),
  minCreditSpent: z.number().int().min(0).optional(),
  maxCreditSpent: z.number().int().min(0).optional(),

  // Reputation filters
  minReputation: z.number().int().min(0).optional(),
  maxReputation: z.number().int().min(0).optional(),

  // Date filters
  registeredAfter: z.coerce.date().optional(),
  registeredBefore: z.coerce.date().optional(),
  lastActiveAfter: z.coerce.date().optional(),
  lastActiveBefore: z.coerce.date().optional(),

  // Status filters
  isSuspended: z.boolean().optional(),
  hasVerifiedEmail: z.boolean().optional(),

  // Search
  searchQuery: z.string().optional(),
});

const SortSchema = z.object({
  field: z
    .enum([
      "name",
      "email",
      "credits",
      "creditSpent",
      "gameCount",
      "promptCount",
      "reputation",
      "createdAt",
      "lastActiveAt",
    ])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const EmailStatusSchema = z.enum([
  "pending",
  "sent",
  "delivered",
  "bounced",
  "complained",
  "failed",
]);

// ========================================
// Router
// ========================================

export const emailRouter = router({
  /**
   * Get filtered users for email targeting
   *
   * Returns users with aggregated stats (game count, prompt count, credits spent)
   * that can be filtered and sorted for email targeting.
   */
  getFilteredUsers: adminProcedure
    .input(
      z.object({
        filters: UserFilterSchema,
        sort: SortSchema,
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      // Build base query conditions for userExtended
      const userWhereConditions: SQL[] = [];

      if (input.filters.role) {
        userWhereConditions.push(eq(userExtended.role, input.filters.role));
      }
      if (input.filters.minCredits !== undefined) {
        userWhereConditions.push(gte(userExtended.credits, input.filters.minCredits));
      }
      if (input.filters.maxCredits !== undefined) {
        userWhereConditions.push(lte(userExtended.credits, input.filters.maxCredits));
      }
      if (input.filters.minReputation !== undefined) {
        userWhereConditions.push(gte(userExtended.reputation, input.filters.minReputation));
      }
      if (input.filters.maxReputation !== undefined) {
        userWhereConditions.push(lte(userExtended.reputation, input.filters.maxReputation));
      }
      if (input.filters.isSuspended !== undefined) {
        userWhereConditions.push(eq(userExtended.isSuspended, input.filters.isSuspended));
      }

      // Build base query conditions for user
      const authWhereConditions: SQL[] = [];

      if (input.filters.registeredAfter) {
        authWhereConditions.push(gte(user.createdAt, input.filters.registeredAfter));
      }
      if (input.filters.registeredBefore) {
        authWhereConditions.push(lte(user.createdAt, input.filters.registeredBefore));
      }
      if (input.filters.hasVerifiedEmail !== undefined) {
        if (input.filters.hasVerifiedEmail) {
          authWhereConditions.push(sql`${user.emailVerified} IS NOT NULL`);
        } else {
          authWhereConditions.push(sql`${user.emailVerified} IS NULL`);
        }
      }
      if (input.filters.searchQuery) {
        const query = `%${input.filters.searchQuery.toLowerCase()}%`;
        const searchCondition = or(
          sql`LOWER(${user.name}) LIKE ${query}`,
          sql`LOWER(${user.email}) LIKE ${query}`,
        );
        if (searchCondition) {
          authWhereConditions.push(searchCondition);
        }
      }

      // Combine conditions
      const allConditions = [...userWhereConditions, ...authWhereConditions];
      const whereClause =
        allConditions.length > 0 ? and(...allConditions) : undefined;

      // Build the query with aggregations
      const usersWithStats = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          role: userExtended.role,
          credits: userExtended.credits,
          reputation: userExtended.reputation,
          isSuspended: userExtended.isSuspended,
          gameCount:
            sql<number>`(SELECT COUNT(*) FROM ${games} g JOIN ${prompts} p ON g.prompt_id = p.id WHERE p.author_id = ${user.id} AND g.status = 'completed')`.as(
              "gameCount",
            ),
          promptCount:
            sql<number>`(SELECT COUNT(*) FROM ${prompts} WHERE author_id = ${user.id})`.as(
              "promptCount",
            ),
          creditSpent:
            sql<number>`(SELECT COALESCE(SUM(ABS(amount)), 0) FROM ${creditTransactions} WHERE user_id = ${user.id} AND type = 'spend')`.as(
              "creditSpent",
            ),
        })
        .from(user)
        .innerJoin(userExtended, eq(user.id, userExtended.id))
        .where(whereClause)
        .limit(input.limit)
        .offset(input.offset);

      // Apply in-memory filters for complex aggregations
      let filtered = usersWithStats.filter((u) => {
        const gameCount = u.gameCount ?? 0;
        const promptCount = u.promptCount ?? 0;
        const creditSpent = u.creditSpent ?? 0;

        if (
          input.filters.minGames !== undefined &&
          gameCount < input.filters.minGames
        )
          return false;
        if (
          input.filters.maxGames !== undefined &&
          gameCount > input.filters.maxGames
        )
          return false;
        if (
          input.filters.minPrompts !== undefined &&
          promptCount < input.filters.minPrompts
        )
          return false;
        if (
          input.filters.maxPrompts !== undefined &&
          promptCount > input.filters.maxPrompts
        )
          return false;
        if (
          input.filters.minCreditSpent !== undefined &&
          creditSpent < input.filters.minCreditSpent
        )
          return false;
        if (
          input.filters.maxCreditSpent !== undefined &&
          creditSpent > input.filters.maxCreditSpent
        )
          return false;

        return true;
      });

      // Handle lastActiveAt filter separately (using session table)
      if (
        input.filters.lastActiveAfter ||
        input.filters.lastActiveBefore
      ) {
        const activeUserIds = new Set<string>();

        for (const u of filtered) {
          const lastSession = await db.query.session.findFirst({
            where: eq(session.userId, u.id),
            columns: { expiresAt: true },
            orderBy: [desc(session.expiresAt)],
          });

          if (lastSession) {
            const lastActive = lastSession.expiresAt;
            let matches = true;

            if (
              input.filters.lastActiveAfter &&
              lastActive < input.filters.lastActiveAfter
            ) {
              matches = false;
            }
            if (
              input.filters.lastActiveBefore &&
              lastActive > input.filters.lastActiveBefore
            ) {
              matches = false;
            }

            if (matches) {
              activeUserIds.add(u.id);
            }
          } else if (
            !input.filters.lastActiveAfter &&
            !input.filters.lastActiveBefore
          ) {
            // No sessions but no filter means keep it
            activeUserIds.add(u.id);
          }
        }

        filtered = filtered.filter((u) => activeUserIds.has(u.id));
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        switch (input.sort.field) {
          case "name":
            aVal = a.name ?? "";
            bVal = b.name ?? "";
            break;
          case "email":
            aVal = a.email;
            bVal = b.email;
            break;
          case "credits":
            aVal = a.credits;
            bVal = b.credits;
            break;
          case "creditSpent":
            aVal = a.creditSpent ?? 0;
            bVal = b.creditSpent ?? 0;
            break;
          case "gameCount":
            aVal = a.gameCount ?? 0;
            bVal = b.gameCount ?? 0;
            break;
          case "promptCount":
            aVal = a.promptCount ?? 0;
            bVal = b.promptCount ?? 0;
            break;
          case "reputation":
            aVal = a.reputation;
            bVal = b.reputation;
            break;
          case "createdAt":
            aVal = a.createdAt?.getTime() ?? 0;
            bVal = b.createdAt?.getTime() ?? 0;
            break;
          case "lastActiveAt":
            // For sorting by last active, we'd need to join sessions
            // Default to createdAt for now
            aVal = a.createdAt?.getTime() ?? 0;
            bVal = b.createdAt?.getTime() ?? 0;
            break;
          default:
            return 0;
        }

        if (typeof aVal === "string") {
          return input.sort.order === "asc"
            ? aVal.localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal);
        }

        return input.sort.order === "asc"
          ? aVal - (bVal as number)
          : (bVal as number) - aVal;
      });

      return {
        users: filtered.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          credits: u.credits,
          reputation: u.reputation,
          isSuspended: u.isSuspended,
          gameCount: u.gameCount ?? 0,
          promptCount: u.promptCount ?? 0,
          creditSpent: Math.abs(u.creditSpent ?? 0),
          createdAt: u.createdAt,
        })),
        total: filtered.length,
      };
    }),

  /**
   * Get count of users matching filters (for preview before sending)
   */
  getFilteredUserCount: adminProcedure
    .input(
      z.object({
        filters: UserFilterSchema,
      }),
    )
    .query(async ({ input }) => {
      // Build base query conditions
      const userWhereConditions: SQL[] = [];

      if (input.filters.role) {
        userWhereConditions.push(eq(userExtended.role, input.filters.role));
      }
      if (input.filters.minCredits !== undefined) {
        userWhereConditions.push(gte(userExtended.credits, input.filters.minCredits));
      }
      if (input.filters.maxCredits !== undefined) {
        userWhereConditions.push(lte(userExtended.credits, input.filters.maxCredits));
      }
      if (input.filters.minReputation !== undefined) {
        userWhereConditions.push(gte(userExtended.reputation, input.filters.minReputation));
      }
      if (input.filters.maxReputation !== undefined) {
        userWhereConditions.push(lte(userExtended.reputation, input.filters.maxReputation));
      }
      if (input.filters.isSuspended !== undefined) {
        userWhereConditions.push(eq(userExtended.isSuspended, input.filters.isSuspended));
      }

      const authWhereConditions: SQL[] = [];

      if (input.filters.registeredAfter) {
        authWhereConditions.push(gte(user.createdAt, input.filters.registeredAfter));
      }
      if (input.filters.registeredBefore) {
        authWhereConditions.push(lte(user.createdAt, input.filters.registeredBefore));
      }
      if (input.filters.hasVerifiedEmail !== undefined) {
        if (input.filters.hasVerifiedEmail) {
          authWhereConditions.push(sql`${user.emailVerified} IS NOT NULL`);
        } else {
          authWhereConditions.push(sql`${user.emailVerified} IS NULL`);
        }
      }
      if (input.filters.searchQuery) {
        const query = `%${input.filters.searchQuery.toLowerCase()}%`;
        const searchCondition = or(
          sql`LOWER(${user.name}) LIKE ${query}`,
          sql`LOWER(${user.email}) LIKE ${query}`,
        );
        if (searchCondition) {
          authWhereConditions.push(searchCondition);
        }
      }

      const allConditions = [...userWhereConditions, ...authWhereConditions];
      const whereClause =
        allConditions.length > 0 ? and(...allConditions) : undefined;

      const result = await db
        .select({ count: count() })
        .from(user)
        .innerJoin(userExtended, eq(user.id, userExtended.id))
        .where(whereClause);

      return { count: result[0]?.count ?? 0 };
    }),

  /**
   * Send email to selected users
   *
   * Sends an email to a list of specific user IDs.
   * Max 100 recipients per request.
   */
  sendToUsers: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string().min(1)).min(1).max(100),
        subject: z.string().min(1).max(200),
        content: z.string().min(1),
        emailType: z.string().default("admin_broadcast"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get users
      const users = await db.query.user.findMany({
        where: inArray(user.id, input.userIds),
        columns: { id: true, name: true, email: true },
      });

      if (users.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No users found",
        });
      }

      const batchId = randomUUID();
      const html = getBroadcastEmailHtml({
        subject: input.subject,
        content: input.content,
      });

      const emails = users.map((u) => ({
        userId: u.id,
        to: u.email,
        subject: input.subject,
        emailType: input.emailType,
        html,
      }));

      const result = await sendBatchEmails(emails, batchId);

      // Log admin action
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "send_email_broadcast",
        targetType: "email",
        targetId: batchId,
        reason: `Sent "${input.subject}" to ${users.length} users`,
        metadata: JSON.stringify({
          batchId,
          subject: input.subject,
          recipientCount: users.length,
          successCount: result.results.filter((r) => r.success).length,
          failureCount: result.results.filter((r) => !r.success).length,
        }),
      });

      return {
        success: result.success,
        batchId,
        sentCount: result.results.filter((r) => r.success).length,
        failedCount: result.results.filter((r) => !r.success).length,
      };
    }),

  /**
   * Send email to all users matching filters
   *
   * Sends an email to all users matching the provided filters.
   * Supports dry-run mode to preview count without sending.
   */
  sendToFiltered: adminProcedure
    .input(
      z.object({
        filters: UserFilterSchema,
        subject: z.string().min(1).max(200),
        content: z.string().min(1),
        emailType: z.string().default("admin_broadcast"),
        dryRun: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Build base query conditions
      const userWhereConditions: SQL[] = [];

      if (input.filters.role) {
        userWhereConditions.push(eq(userExtended.role, input.filters.role));
      }
      if (input.filters.minCredits !== undefined) {
        userWhereConditions.push(gte(userExtended.credits, input.filters.minCredits));
      }
      if (input.filters.maxCredits !== undefined) {
        userWhereConditions.push(lte(userExtended.credits, input.filters.maxCredits));
      }
      if (input.filters.minReputation !== undefined) {
        userWhereConditions.push(gte(userExtended.reputation, input.filters.minReputation));
      }
      if (input.filters.maxReputation !== undefined) {
        userWhereConditions.push(lte(userExtended.reputation, input.filters.maxReputation));
      }
      if (input.filters.isSuspended !== undefined) {
        userWhereConditions.push(eq(userExtended.isSuspended, input.filters.isSuspended));
      }

      const authWhereConditions: SQL[] = [];

      if (input.filters.registeredAfter) {
        authWhereConditions.push(gte(user.createdAt, input.filters.registeredAfter));
      }
      if (input.filters.registeredBefore) {
        authWhereConditions.push(lte(user.createdAt, input.filters.registeredBefore));
      }
      if (input.filters.hasVerifiedEmail !== undefined) {
        if (input.filters.hasVerifiedEmail) {
          authWhereConditions.push(sql`${user.emailVerified} IS NOT NULL`);
        } else {
          authWhereConditions.push(sql`${user.emailVerified} IS NULL`);
        }
      }
      if (input.filters.searchQuery) {
        const query = `%${input.filters.searchQuery.toLowerCase()}%`;
        const searchCondition = or(
          sql`LOWER(${user.name}) LIKE ${query}`,
          sql`LOWER(${user.email}) LIKE ${query}`,
        );
        if (searchCondition) {
          authWhereConditions.push(searchCondition);
        }
      }

      const allConditions = [...userWhereConditions, ...authWhereConditions];
      const whereClause =
        allConditions.length > 0 ? and(...allConditions) : undefined;

      // Get matching users
      const matchingUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .innerJoin(userExtended, eq(user.id, userExtended.id))
        .where(whereClause);

      if (input.dryRun) {
        return {
          dryRun: true,
          estimatedRecipients: matchingUsers.length,
        };
      }

      if (matchingUsers.length === 0) {
        return {
          success: true,
          batchId: randomUUID(),
          sentCount: 0,
          failedCount: 0,
        };
      }

      const batchId = randomUUID();
      const html = getBroadcastEmailHtml({
        subject: input.subject,
        content: input.content,
      });

      // Process in batches of 100
      const batchSize = 100;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < matchingUsers.length; i += batchSize) {
        const batch = matchingUsers.slice(i, i + batchSize);

        const emails = batch.map((u) => ({
          userId: u.id,
          to: u.email,
          subject: input.subject,
          emailType: input.emailType,
          html,
        }));

        const result = await sendBatchEmails(emails, `${batchId}-${i}`);

        totalSent += result.results.filter((r) => r.success).length;
        totalFailed += result.results.filter((r) => !r.success).length;
      }

      // Log admin action
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "send_email_broadcast",
        targetType: "email",
        targetId: batchId,
        reason: `Sent "${input.subject}" to ${matchingUsers.length} filtered users`,
        metadata: JSON.stringify({
          batchId,
          subject: input.subject,
          recipientCount: matchingUsers.length,
          successCount: totalSent,
          failureCount: totalFailed,
          filters: input.filters,
        }),
      });

      return {
        success: totalFailed === 0,
        batchId,
        sentCount: totalSent,
        failedCount: totalFailed,
      };
    }),

  /**
   * Get email logs
   *
   * Returns paginated email logs with optional filtering by type, status, user, and date range.
   */
  getLogs: adminProcedure
    .input(
      z.object({
        emailType: z.string().optional(),
        status: EmailStatusSchema.optional(),
        userId: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const whereConditions: SQL[] = [];

      if (input.emailType) {
        whereConditions.push(eq(emailLogs.emailType, input.emailType));
      }
      if (input.status) {
        whereConditions.push(eq(emailLogs.status, input.status));
      }
      if (input.userId) {
        whereConditions.push(eq(emailLogs.userId, input.userId));
      }
      if (input.startDate) {
        whereConditions.push(gte(emailLogs.createdAt, input.startDate));
      }
      if (input.endDate) {
        whereConditions.push(lte(emailLogs.createdAt, input.endDate));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [logs, totalResult] = await Promise.all([
        db.query.emailLogs.findMany({
          where: whereClause,
          limit: input.limit,
          offset: input.offset,
          orderBy: [desc(emailLogs.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        db
          .select({ count: count() })
          .from(emailLogs)
          .where(whereClause),
      ]);

      return {
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          userName: log.user?.name,
          userEmail: log.user?.email,
          resendId: log.resendId,
          emailType: log.emailType,
          status: log.status,
          subject: log.subject,
          errorMessage: log.errorMessage,
          sentAt: log.sentAt,
          deliveredAt: log.deliveredAt,
          createdAt: log.createdAt,
        })),
        total: totalResult[0]?.count ?? 0,
      };
    }),

  /**
   * Get email statistics
   *
   * Returns aggregated email statistics grouped by status and type.
   */
  getStats: adminProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const whereConditions: SQL[] = [];

      if (input.startDate) {
        whereConditions.push(gte(emailLogs.createdAt, input.startDate));
      }
      if (input.endDate) {
        whereConditions.push(lte(emailLogs.createdAt, input.endDate));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const stats = await db
        .select({
          status: emailLogs.status,
          count: count(),
        })
        .from(emailLogs)
        .where(whereClause)
        .groupBy(emailLogs.status);

      const byType = await db
        .select({
          emailType: emailLogs.emailType,
          count: count(),
        })
        .from(emailLogs)
        .where(whereClause)
        .groupBy(emailLogs.emailType);

      return {
        byStatus: Object.fromEntries(stats.map((s) => [s.status, s.count])),
        byType: Object.fromEntries(byType.map((t) => [t.emailType, t.count])),
        total: stats.reduce((sum, s) => sum + s.count, 0),
      };
    }),
});
