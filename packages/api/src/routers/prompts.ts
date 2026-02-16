import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { themes } from "@arcade-vibe/db/schema/themes";
import { games } from "@arcade-vibe/db/schema/games";
import { z } from "zod";
import { eq, desc, asc, or, and, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  getTokenCount,
  generateContentHash,
} from "@arcade-vibe/api/lib/tokenizer";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "@arcade-vibe/api/middleware/rate-limit";

export const promptsRouter = router({
  create: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        themeId: z.string().uuid(),
        content: z.string().min(1),
        tokenizer: z.string().default("gpt-4"),
        visibility: z
          .enum(["private", "public_on_freeze", "public"])
          .default("private"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const theme = await db.query.themes.findFirst({
        where: eq(themes.id, input.themeId),
      });

      if (!theme) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Theme not found",
        });
      }

      if (theme.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot create prompts for non-active themes",
        });
      }

      const now = new Date();
      if (theme.startDate && theme.startDate > now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Theme has not started yet",
        });
      }
      if (theme.endDate && theme.endDate < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Theme has already ended",
        });
      }

      const tokenCount = getTokenCount(input.content, input.tokenizer);
      const contentHash = generateContentHash(input.content);

      const newPrompt = await db
        .insert(prompts)
        .values({
          authorId: ctx.user.id,
          themeId: input.themeId,
          content: input.content,
          contentHash,
          tokenCount,
          tokenizer: input.tokenizer,
          visibility: input.visibility,
          version: 1,
        })
        .returning();

      return {
        success: true,
        promptId: newPrompt[0]?.id,
        version: 1,
        tokenCount,
      };
    }),

  update: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1),
        tokenizer: z.string().default("gpt-4"),
        visibility: z
          .enum(["private", "public_on_freeze", "public"])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const originalPrompt = await promptsQuery.findFirst({
        where: eq(prompts.id, input.id),
      });

      if (!originalPrompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (originalPrompt.authorId !== ctx.user?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own prompts",
        });
      }

      const tokenCount = getTokenCount(input.content, input.tokenizer);
      const contentHash = generateContentHash(input.content);

      const newVersion = await db
        .insert(prompts)
        .values({
          authorId: originalPrompt.authorId,
          themeId: originalPrompt.themeId,
          parentId: originalPrompt.id,
          content: input.content,
          contentHash,
          tokenCount,
          tokenizer: input.tokenizer,
          visibility: input.visibility ?? originalPrompt.visibility,
          version: originalPrompt.version + 1,
        })
        .returning();

      return {
        success: true,
        promptId: newVersion[0]?.id,
        version: originalPrompt.version + 1,
        tokenCount,
      };
    }),

  fork: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        promptId: z.string().uuid(),
        visibility: z
          .enum(["private", "public_on_freeze", "public"])
          .default("private"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const originalPrompt = await promptsQuery.findFirst({
        where: eq(prompts.id, input.promptId),
      });

      if (!originalPrompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      const newPrompt = await db
        .insert(prompts)
        .values({
          authorId: ctx.user.id,
          themeId: originalPrompt.themeId,
          parentId: originalPrompt.id,
          content: originalPrompt.content,
          contentHash: originalPrompt.contentHash,
          tokenCount: originalPrompt.tokenCount,
          tokenizer: originalPrompt.tokenizer,
          visibility: input.visibility,
          version: 1,
        })
        .returning();

      return {
        success: true,
        promptId: newPrompt[0]?.id,
        forkedFrom: originalPrompt.id,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const prompt = await promptsQuery.findFirst({
        where: eq(prompts.id, input.id),
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      return prompt;
    }),

  listVersions: publicProcedure
    .input(z.object({ promptId: z.string().uuid() }))
    .query(async ({ input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const original = await promptsQuery.findFirst({
        where: eq(prompts.id, input.promptId),
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      const versions = await promptsQuery.findMany({
        where: or(
          eq(prompts.id, input.promptId),
          eq(prompts.parentId, input.promptId),
        ),
        orderBy: [asc(prompts.version)],
      });

      return versions;
    }),

  getVersion: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        version: z.number().int().positive(),
      }),
    )
    .query(async ({ input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const version = await promptsQuery.findFirst({
        where: and(
          eq(prompts.id, input.promptId),
          eq(prompts.version, input.version),
        ),
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt version not found",
        });
      }

      return version;
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const promptsQuery = db.query.prompts;
    if (!promptsQuery) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database query not available",
      });
    }

    const myPrompts = await promptsQuery.findMany({
      where: eq(prompts.authorId, ctx.user.id),
      orderBy: [desc(prompts.createdAt)],
    });

    return myPrompts;
  }),

  listMineByTheme: protectedProcedure
    .input(z.object({ themeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const myPrompts = await promptsQuery.findMany({
        where: and(
          eq(prompts.authorId, ctx.user.id),
          eq(prompts.themeId, input.themeId),
          isNull(prompts.parentId),
        ),
        orderBy: [desc(prompts.updatedAt)],
        columns: {
          id: true,
          content: true,
          version: true,
          visibility: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return myPrompts.map((prompt) => ({
        ...prompt,
        content: prompt.content.slice(0, 100),
      }));
    }),

  listPublic: publicProcedure.query(async () => {
    const promptsQuery = db.query.prompts;
    if (!promptsQuery) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database query not available",
      });
    }

    const publicPrompts = await promptsQuery.findMany({
      where: eq(prompts.visibility, "public"),
      orderBy: [desc(prompts.createdAt)],
      limit: 50,
    });

    return publicPrompts;
  }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const prompt = await promptsQuery.findFirst({
        where: eq(prompts.id, input.id),
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.authorId !== ctx.user?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own prompts",
        });
      }

      const [gamesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(and(
          eq(games.promptId, input.id),
          isNull(games.deletedAt),
        ));

      if ((gamesCount?.count ?? 0) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete prompt with associated games. Delete the games first.",
        });
      }

      await db.delete(prompts).where(eq(prompts.id, input.id));

      return {
        success: true,
        promptId: input.id,
      };
    }),
});
