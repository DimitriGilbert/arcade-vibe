import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { user, session } from "@arcade-vibe/db/schema/auth";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { creditTransactions } from "@arcade-vibe/db/schema/credits";
import { emailLogs, emailTemplates } from "@arcade-vibe/db/schema/email";
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
  getAvailableTemplates,
  renderEmail,
  type EmailTemplateId,
  type EmailUser,
} from "@arcade-vibe/email";
import { randomUUID } from "node:crypto";

const UserFilterSchema = z.object({
  role: z.enum(["admin", "moderator", "participant", "viewer"]).optional(),
  minGames: z.number().int().min(0).optional(),
  maxGames: z.number().int().min(0).optional(),
  minPrompts: z.number().int().min(0).optional(),
  maxPrompts: z.number().int().min(0).optional(),
  minCredits: z.number().int().min(0).optional(),
  maxCredits: z.number().int().min(0).optional(),
  minCreditSpent: z.number().int().min(0).optional(),
  maxCreditSpent: z.number().int().min(0).optional(),
  minReputation: z.number().int().min(0).optional(),
  maxReputation: z.number().int().min(0).optional(),
  registeredAfter: z.coerce.date().optional(),
  registeredBefore: z.coerce.date().optional(),
  lastActiveAfter: z.coerce.date().optional(),
  lastActiveBefore: z.coerce.date().optional(),
  isSuspended: z.boolean().optional(),
  hasVerifiedEmail: z.boolean().optional(),
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

function mapUserToEmailUser(u: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  credits: number;
  reputation: number;
  gameCount: number | null;
  promptCount: number | null;
  creditSpent: number | null;
  createdAt: Date | null;
}): EmailUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    credits: u.credits,
    reputation: u.reputation,
    gameCount: u.gameCount ?? 0,
    promptCount: u.promptCount ?? 0,
    creditSpent: u.creditSpent ? Math.abs(u.creditSpent) : 0,
    createdAt: u.createdAt,
  };
}

export const emailRouter = router({
  getTemplates: adminProcedure.query(async () => {
    const templates = getAvailableTemplates();
    const dbTemplates = await db.query.emailTemplates.findMany({
      where: eq(emailTemplates.isActive, true),
      orderBy: [desc(emailTemplates.createdAt)],
    });

    return {
      predefined: templates,
      custom: dbTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        variables: t.variables ?? [],
        createdAt: t.createdAt,
      })),
    };
  }),

  getTemplateDefinition: adminProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      const predefined = getAvailableTemplates().find(
        (t) => t.id === input.templateId,
      );
      if (predefined) {
        return { type: "predefined" as const, template: predefined };
      }

      const dbTemplate = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.templateId),
      });

      if (dbTemplate) {
        return {
          type: "custom" as const,
          template: {
            id: dbTemplate.id,
            name: dbTemplate.name,
            subject: dbTemplate.subject,
            htmlContent: dbTemplate.htmlContent,
            textContent: dbTemplate.textContent,
            variables: dbTemplate.variables ?? [],
          },
        };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }),

  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        subject: z.string().min(1).max(200),
        htmlContent: z.string().min(1),
        textContent: z.string().optional(),
        variables: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [template] = await db
        .insert(emailTemplates)
        .values({
          name: input.name,
          subject: input.subject,
          htmlContent: input.htmlContent,
          textContent: input.textContent,
          variables: input.variables,
          createdBy: ctx.user.id,
        })
        .returning();

      return template;
    }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        subject: z.string().min(1).max(200).optional(),
        htmlContent: z.string().min(1).optional(),
        textContent: z.string().optional(),
        variables: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      const [template] = await db
        .update(emailTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, id))
        .returning();

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return template;
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const [template] = await db
        .update(emailTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(emailTemplates.id, input.id))
        .returning();

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return { success: true };
    }),

  previewTemplate: adminProcedure
    .input(
      z.object({
        templateId: z.string(),
        variables: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ input }) => {
      const predefinedTemplate = getAvailableTemplates().find(
        (t) => t.id === input.templateId,
      );

      const previewUser: EmailUser = {
        id: "preview-user",
        name: (input.variables.userName as string) ?? "Preview User",
        email: "preview@example.com",
        role: "participant",
        credits: 100,
        reputation: 50,
        gameCount: 10,
        promptCount: 5,
        creditSpent: 25,
        createdAt: new Date(),
      };

      if (predefinedTemplate) {
        const rendered = await renderEmail({
          templateId: input.templateId as EmailTemplateId,
          user: previewUser,
          variables: input.variables,
        });
        return { html: rendered.html, text: rendered.text };
      }

      const dbTemplate = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.templateId),
      });

      if (dbTemplate) {
        let html = dbTemplate.htmlContent;
        let text = dbTemplate.textContent ?? "";

        for (const [key, value] of Object.entries(input.variables)) {
          const placeholder = `{{${key}}}`;
          const strValue = String(value);
          html = html.replaceAll(placeholder, strValue);
          text = text.replaceAll(placeholder, strValue);
        }

        for (const [key, value] of Object.entries(previewUser)) {
          const placeholder = `{{user.${key}}}`;
          const strValue = value === null ? "" : String(value);
          html = html.replaceAll(placeholder, strValue);
          text = text.replaceAll(placeholder, strValue);
        }

        return { html, text };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }),

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
            activeUserIds.add(u.id);
          }
        }

        filtered = filtered.filter((u) => activeUserIds.has(u.id));
      }

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

  getFilteredUserCount: adminProcedure
    .input(
      z.object({
        filters: UserFilterSchema,
      }),
    )
    .query(async ({ input }) => {
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

  sendToUsers: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string().min(1)).min(1).max(100),
        templateId: z.enum(["welcome", "broadcast", "custom"]),
        subject: z.string().min(1).max(200),
        content: z.string().min(1),
        variables: z.record(z.string(), z.unknown()).optional(),
        emailType: z.string().default("admin_broadcast"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          role: userExtended.role,
          credits: userExtended.credits,
          reputation: userExtended.reputation,
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
        .where(inArray(user.id, input.userIds));

      if (users.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No users found",
        });
      }

      const batchId = randomUUID();
      const emails = await Promise.all(
        users.map(async (u) => {
          const emailUser = mapUserToEmailUser(u);
          const variables = {
            ...input.variables,
            subject: input.subject,
            content: input.content,
            contentHtml: input.content,
          };

          let html: string;
          let text: string;

          if (input.templateId === "custom") {
            const rendered = await renderEmail({
              templateId: input.templateId,
              user: emailUser,
              variables: { subject: input.subject, contentHtml: input.content },
            });
            html = rendered.html;
            text = rendered.text;
          } else {
            const rendered = await renderEmail({
              templateId: input.templateId,
              user: emailUser,
              variables,
            });
            html = rendered.html;
            text = rendered.text;
          }

          return {
            userId: u.id,
            to: u.email,
            subject: input.subject,
            emailType: input.emailType,
            html,
            text,
            templateId: input.templateId,
            user: emailUser,
            templateVariables: variables,
          };
        }),
      );

      const result = await sendBatchEmails(emails, batchId);

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

  sendToFiltered: adminProcedure
    .input(
      z.object({
        filters: UserFilterSchema,
        templateId: z.enum(["welcome", "broadcast", "custom"]),
        subject: z.string().min(1).max(200),
        content: z.string().min(1),
        variables: z.record(z.string(), z.unknown()).optional(),
        emailType: z.string().default("admin_broadcast"),
        dryRun: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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

      const matchingUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          role: userExtended.role,
          credits: userExtended.credits,
          reputation: userExtended.reputation,
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
      const batchSize = 100;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < matchingUsers.length; i += batchSize) {
        const batch = matchingUsers.slice(i, i + batchSize);

        const emails = await Promise.all(
          batch.map(async (u) => {
            const emailUser = mapUserToEmailUser(u);
            const variables = {
              ...input.variables,
              subject: input.subject,
              content: input.content,
              contentHtml: input.content,
            };

            let html: string;
            let text: string;

            if (input.templateId === "custom") {
              const rendered = await renderEmail({
                templateId: input.templateId,
                user: emailUser,
                variables: { subject: input.subject, contentHtml: input.content },
              });
              html = rendered.html;
              text = rendered.text;
            } else {
              const rendered = await renderEmail({
                templateId: input.templateId,
                user: emailUser,
                variables,
              });
              html = rendered.html;
              text = rendered.text;
            }

            return {
              userId: u.id,
              to: u.email,
              subject: input.subject,
              emailType: input.emailType,
              html,
              text,
              templateId: input.templateId,
              user: emailUser,
              templateVariables: variables,
            };
          }),
        );

        const result = await sendBatchEmails(emails, `${batchId}-${i}`);

        totalSent += result.results.filter((r) => r.success).length;
        totalFailed += result.results.filter((r) => !r.success).length;
      }

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
