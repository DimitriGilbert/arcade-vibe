import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { z } from "zod";
import { eq, desc, asc, or, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getTokenCount, generateContentHash } from "@arcade-vibe/api/lib/tokenizer";

export const promptsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        content: z.string().min(1),
        tokenizer: z.string().default("gpt-4"),
        visibility: z.enum(["private", "public_on_freeze", "public"]).default("private"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const tokenCount = getTokenCount(input.content, input.tokenizer);
      const contentHash = generateContentHash(input.content);

      const newPrompt = await db.insert(prompts).values({
        authorId: ctx.user.id,
        themeId: input.themeId,
        content: input.content,
        contentHash,
        tokenCount,
        tokenizer: input.tokenizer,
        visibility: input.visibility,
        version: 1,
      }).returning();

      return {
        success: true,
        promptId: newPrompt[0]?.id,
        version: 1,
        tokenCount,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1),
        tokenizer: z.string().default("gpt-4"),
        visibility: z.enum(["private", "public_on_freeze", "public"]).optional(),
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

      const newVersion = await db.insert(prompts).values({
        authorId: originalPrompt.authorId,
        themeId: originalPrompt.themeId,
        parentId: originalPrompt.id,
        content: input.content,
        contentHash,
        tokenCount,
        tokenizer: input.tokenizer,
        visibility: input.visibility ?? originalPrompt.visibility,
        version: originalPrompt.version + 1,
      }).returning();

      return {
        success: true,
        promptId: newVersion[0]?.id,
        version: originalPrompt.version + 1,
        tokenCount,
      };
    }),

  fork: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        visibility: z.enum(["private", "public_on_freeze", "public"]).default("private"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

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

      const newPrompt = await db.insert(prompts).values({
        authorId: ctx.user.id,
        themeId: originalPrompt.themeId,
        parentId: originalPrompt.id,
        content: originalPrompt.content,
        contentHash: originalPrompt.contentHash,
        tokenCount: originalPrompt.tokenCount,
        tokenizer: originalPrompt.tokenizer,
        visibility: input.visibility,
        version: 1,
      }).returning();

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
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

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
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

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
});
