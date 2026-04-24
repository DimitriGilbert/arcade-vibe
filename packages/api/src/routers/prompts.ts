import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { themes } from "@arcade-vibe/db/schema/themes";
import { games, gameScores as gameScoresTable, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { scores } from "@arcade-vibe/db/schema/scores";
import { user } from "@arcade-vibe/db/schema/auth";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { z } from "zod";
import { eq, desc, asc, or, and, isNull, isNotNull, sql, inArray, count } from "drizzle-orm";
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
        title: z.string().max(100).optional(),
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
          title: input.title,
          contentHash,
          tokenCount,
          tokenizer: input.tokenizer,
          visibility: input.visibility,
          version: 1,
          relationType: "version",
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
        title: z.string().max(100).optional(),
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

      let rootPromptId: string = originalPrompt.id;
      if (originalPrompt.parentId) {
        rootPromptId = originalPrompt.parentId;
      }

      const allVersions = await promptsQuery.findMany({
        where: or(
          eq(prompts.id, rootPromptId),
          eq(prompts.parentId, rootPromptId),
        ),
        columns: { version: true },
      });
      const maxVersion = Math.max(...allVersions.map((p) => p.version), 0);

      const tokenCount = getTokenCount(input.content, input.tokenizer);
      const contentHash = generateContentHash(input.content);

      const newVersion = await db
        .insert(prompts)
        .values({
          authorId: originalPrompt.authorId,
          themeId: originalPrompt.themeId,
          parentId: rootPromptId,
          content: input.content,
          title: input.title ?? originalPrompt.title,
          contentHash,
          tokenCount,
          tokenizer: input.tokenizer,
          visibility: input.visibility ?? originalPrompt.visibility,
          version: maxVersion + 1,
          relationType: "version",
        })
        .returning();

      return {
        success: true,
        promptId: newVersion[0]?.id,
        version: maxVersion + 1,
        tokenCount,
      };
    }),

  fork: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        promptId: z.string().uuid(),
        themeId: z.string().uuid().optional(),
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

      const canAccess =
        originalPrompt.visibility === "public" ||
        originalPrompt.authorId === ctx.user.id ||
        ctx.user.role === "admin" ||
        ctx.user.role === "moderator";

      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to fork this prompt",
        });
      }

      const targetThemeId = input.themeId ?? originalPrompt.themeId;

      if (input.themeId !== undefined) {
        const theme = await db.query.themes.findFirst({
          where: eq(themes.id, input.themeId),
        });

        if (!theme) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target theme not found",
          });
        }
      }

      const newPrompt = await db
        .insert(prompts)
        .values({
          authorId: ctx.user.id,
          themeId: targetThemeId,
          parentId: originalPrompt.id,
          content: originalPrompt.content,
          title: originalPrompt.title,
          contentHash: originalPrompt.contentHash,
          tokenCount: originalPrompt.tokenCount,
          tokenizer: originalPrompt.tokenizer,
          visibility: input.visibility,
          version: 1,
          relationType: "fork",
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

      const rootPromptId = original.parentId ?? original.id;

      const versions = await promptsQuery.findMany({
        where: or(
          eq(prompts.id, rootPromptId),
          eq(prompts.parentId, rootPromptId),
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

      const allPrompts = await promptsQuery.findMany({
        where: and(
          eq(prompts.authorId, ctx.user.id),
          eq(prompts.themeId, input.themeId),
          isNull(prompts.hiddenAt),
        ),
        orderBy: [desc(prompts.version)],
        columns: {
          id: true,
          title: true,
          content: true,
          version: true,
          visibility: true,
          status: true,
          isBenchmark: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        },
      });

      const latestByChain = new Map<
        string,
        (typeof allPrompts)[number]
      >();
      for (const prompt of allPrompts) {
        const chainId = prompt.parentId ?? prompt.id;
        if (chainId && !latestByChain.has(chainId)) {
          latestByChain.set(chainId, prompt);
        }
      }

      const latestPrompts = Array.from(latestByChain.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      return latestPrompts.map((prompt) => ({
        id: prompt.id,
        title: prompt.title,
        content: prompt.content.slice(0, 100),
        version: prompt.version,
        visibility: prompt.visibility,
        status: prompt.status,
        isBenchmark: prompt.isBenchmark,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
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

  listByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        includePrivate: z.boolean().default(false),
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

      if (input.includePrivate) {
        const userPrompts = await promptsQuery.findMany({
          where: eq(prompts.authorId, input.userId),
          orderBy: [desc(prompts.createdAt)],
          limit: 100,
        });
        return userPrompts;
      }

      const userPrompts = await promptsQuery.findMany({
        where: and(
          eq(prompts.authorId, input.userId),
          eq(prompts.visibility, "public"),
        ),
        orderBy: [desc(prompts.createdAt)],
        limit: 100,
      });

      return userPrompts;
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

  softDelete: protectedProcedure
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

      if (prompt.hiddenAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Prompt is already deleted",
        });
      }

      const updated = await db
        .update(prompts)
        .set({
          hiddenAt: new Date(),
          hiddenBy: ctx.user.id,
          hiddenReason: "User deleted",
        })
        .where(eq(prompts.id, input.id))
        .returning();

      return {
        success: true,
        promptId: updated[0]?.id,
        hiddenAt: updated[0]?.hiddenAt,
      };
    }),

  updateVisibility: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        visibility: z.enum(["private", "public_on_freeze", "public"]),
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
          message: "You can only update your own prompts",
        });
      }

      if (prompt.hiddenAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update visibility of a deleted prompt",
        });
      }

      const updated = await db
        .update(prompts)
        .set({
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(eq(prompts.id, input.id))
        .returning();

      return {
        success: true,
        promptId: updated[0]?.id,
        visibility: updated[0]?.visibility,
      };
    }),

  getPublicById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const prompt = await db.query.prompts.findFirst({
        where: and(eq(prompts.id, input.id), eq(prompts.visibility, "public")),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
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

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      const [gameCountRow, forkCountRow, ratingStats] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(games)
          .where(
            and(
              eq(games.promptId, input.id),
              eq(games.status, "completed"),
              eq(games.isHidden, false),
              isNull(games.deletedAt),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(prompts)
          .where(
            and(
              eq(prompts.parentId, input.id),
              eq(prompts.relationType, "fork"),
              eq(prompts.visibility, "public"),
            ),
          ),
        db
          .select({
            avgRating: sql<string | null>`avg(${ratings.overall})`,
            ratingCount: sql<number>`count(*)`,
          })
          .from(ratings)
          .innerJoin(games, eq(ratings.gameId, games.id))
          .where(
            and(
              eq(games.promptId, input.id),
              eq(games.status, "completed"),
              eq(games.isHidden, false),
              isNull(games.deletedAt),
            ),
          ),
      ]);

      return {
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        tokenCount: prompt.tokenCount,
        tokenizer: prompt.tokenizer,
        version: prompt.version,
        visibility: prompt.visibility,
        status: prompt.status,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
        author: prompt.user,
        theme: prompt.theme,
        stats: {
          gameCount: Number(gameCountRow[0]?.count ?? 0),
          forkCount: Number(forkCountRow[0]?.count ?? 0),
          avgRating: ratingStats[0]?.avgRating ? Number(ratingStats[0].avgRating) : 0,
          ratingCount: Number(ratingStats[0]?.ratingCount ?? 0),
        },
      };
    }),

  listGamesByPrompt: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(30),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }) => {
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
        columns: {
          id: true,
          visibility: true,
        },
      });

      if (!prompt || prompt.visibility !== "public") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      const whereConditions = [
        eq(games.promptId, input.promptId),
        eq(games.status, "completed"),
        eq(games.isSubmitted, true),
        eq(games.isHidden, false),
        isNull(games.deletedAt),
      ];

      if (input.cursor) {
        whereConditions.push(sql`${games.id} < ${input.cursor}`);
      }

      const promptGames = await db
        .select({
          id: games.id,
          name: games.name,
          modelName: games.modelName,
          modelProvider: games.modelProvider,
          createdAt: games.createdAt,
          isSubmitted: games.isSubmitted,
          imageUrl: games.imageUrl,
          themeId: games.themeId,
          tierCostId: games.tierCostId,
        })
        .from(games)
        .where(and(...whereConditions))
        .orderBy(desc(games.createdAt))
        .limit(input.limit + 1);

      const hasMore = promptGames.length > input.limit;
      const gamesResult = hasMore ? promptGames.slice(0, -1) : promptGames;

      const gameIds = gamesResult.map((g) => g.id);
      const themeIds = [...new Set(gamesResult.map((g) => g.themeId).filter((id): id is string => id !== null))];
      const tierCostIds = [...new Set(gamesResult.map((g) => g.tierCostId))];

      const [ratingsData, scoresData, themesData, tierCostsData] = await Promise.all([
        gameIds.length > 0
          ? db
              .select({ gameId: ratings.gameId, overall: ratings.overall })
              .from(ratings)
              .where(inArray(ratings.gameId, gameIds))
          : [],
        gameIds.length > 0
          ? db
              .select({ gameId: gameScoresTable.gameId, score: gameScoresTable.score })
              .from(gameScoresTable)
              .where(
                and(inArray(gameScoresTable.gameId, gameIds), eq(gameScoresTable.isHighScore, true)),
              )
          : [],
        themeIds.length > 0
          ? db
              .select({ id: themes.id, title: themes.title })
              .from(themes)
              .where(inArray(themes.id, themeIds))
          : [],
        tierCostIds.length > 0
          ? db
              .select({ id: tierCosts.id, slug: tierCosts.slug, name: tierCosts.name })
              .from(tierCosts)
              .where(inArray(tierCosts.id, tierCostIds))
          : [],
      ]);

      const ratingsByGame = new Map<string, number[]>();
      for (const r of ratingsData) {
        const existing = ratingsByGame.get(r.gameId) ?? [];
        existing.push(r.overall);
        ratingsByGame.set(r.gameId, existing);
      }

      const highScoreByGame = new Map<string, number>();
      for (const s of scoresData) {
        if (!highScoreByGame.has(s.gameId)) {
          highScoreByGame.set(s.gameId, s.score);
        }
      }

      const themeById = new Map(themesData.map((t) => [t.id, t]));
      const tierCostById = new Map(tierCostsData.map((t) => [t.id, t]));

      const items = gamesResult.map((game) => {
        const gameRatings = ratingsByGame.get(game.id) ?? [];
        const ratingCount = gameRatings.length;
        const avgRating = ratingCount === 0 ? 0 : gameRatings.reduce((a, b) => a + b, 0) / ratingCount;
        const highScore = highScoreByGame.get(game.id) ?? null;
        const theme = game.themeId ? themeById.get(game.themeId) ?? null : null;
        const tier = tierCostById.get(game.tierCostId) ?? null;

        return {
          id: game.id,
          name: game.name,
          modelName: game.modelName,
          modelProvider: game.modelProvider,
          createdAt: game.createdAt,
          isSubmitted: game.isSubmitted,
          imageUrl: game.imageUrl,
          theme,
          tier,
          ratingCount,
          avgRating,
          highScore,
        };
      });

      return {
        items,
        nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      };
    }),

  listForksByPrompt: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(30),
      }),
    )
    .query(async ({ input }) => {
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
        columns: {
          id: true,
          visibility: true,
        },
      });

      if (!prompt || prompt.visibility !== "public") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      const forks = await db
        .select({
          id: prompts.id,
          content: prompts.content,
          createdAt: prompts.createdAt,
          version: prompts.version,
          authorId: prompts.authorId,
        })
        .from(prompts)
        .where(
          and(
            eq(prompts.parentId, input.promptId),
            eq(prompts.relationType, "fork"),
            eq(prompts.visibility, "public"),
            isNull(prompts.hiddenAt),
          ),
        )
        .orderBy(desc(prompts.createdAt))
        .limit(input.limit);

      const forkIds = forks.map((f) => f.id);
      const authorIds = [...new Set(forks.map((f) => f.authorId))];

      const [gameCounts, authorsData] = await Promise.all([
        forkIds.length > 0
          ? db
              .select({
                promptId: games.promptId,
                count: sql<number>`count(*)`,
              })
              .from(games)
              .where(
                and(
                  inArray(games.promptId, forkIds),
                  eq(games.status, "completed"),
                  eq(games.isHidden, false),
                  isNull(games.deletedAt),
                ),
              )
              .groupBy(games.promptId)
          : [],
        authorIds.length > 0
          ? db
              .select({ id: user.id, name: user.name, image: user.image })
              .from(user)
              .where(inArray(user.id, authorIds))
          : [],
      ]);

      const gameCountMap = new Map(gameCounts.map((row) => [row.promptId, Number(row.count)]));
      const authorMap = new Map(authorsData.map((a) => [a.id, a]));

      return forks.map((fork) => ({
        id: fork.id,
        contentPreview: fork.content.slice(0, 150),
        createdAt: fork.createdAt,
        version: fork.version,
        author: authorMap.get(fork.authorId) ?? null,
        gameCount: gameCountMap.get(fork.id) ?? 0,
      }));
    }),

  listPublicPaginated: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input }) => {
      const conditions = and(
        eq(prompts.visibility, "public"),
        isNull(prompts.hiddenAt),
      );

      const totalResult = await db
        .select({ total: count() })
        .from(prompts)
        .where(conditions);

      const totalItems = totalResult[0]?.total ?? 0;
      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / input.pageSize);
      const offset = (input.page - 1) * input.pageSize;

      const items = await db.query.prompts.findMany({
        where: conditions,
        columns: {
          id: true,
          title: true,
          content: true,
          tokenCount: true,
          version: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          themeId: true,
        },
        orderBy: [desc(prompts.createdAt)],
        limit: input.pageSize,
        offset,
        with: {
          theme: {
            columns: {
              id: true,
              title: true,
            },
          },
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      const promptIds = items.map((p) => p.id);

      const [gameCounts, forkCounts] = await Promise.all([
        promptIds.length > 0
          ? db
              .select({
                promptId: games.promptId,
                count: sql<number>`count(*)`,
              })
              .from(games)
              .where(
                and(
                  inArray(games.promptId, promptIds),
                  eq(games.status, "completed"),
                  eq(games.isHidden, false),
                  isNull(games.deletedAt),
                ),
              )
              .groupBy(games.promptId)
          : [],
        promptIds.length > 0
          ? db
              .select({
                parentId: prompts.parentId,
                count: sql<number>`count(*)`,
              })
              .from(prompts)
              .where(
                and(
                  inArray(prompts.parentId, promptIds),
                  eq(prompts.relationType, "fork"),
                  eq(prompts.visibility, "public"),
                ),
              )
              .groupBy(prompts.parentId)
          : [],
      ]);

      const gameCountMap = new Map(gameCounts.map((row) => [row.promptId, Number(row.count)]));
      const forkCountMap = new Map(forkCounts.map((row) => [row.parentId, Number(row.count)]));

      return {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          tokenCount: item.tokenCount,
          version: item.version,
          visibility: item.visibility,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          theme: item.theme,
          author: item.user,
          gameCount: gameCountMap.get(item.id) ?? 0,
          forkCount: forkCountMap.get(item.id) ?? 0,
        })),
        total: totalItems,
        page: input.page,
        pageSize: input.pageSize,
        totalPages,
        hasNextPage: totalPages > 0 && input.page < totalPages,
        hasPreviousPage: input.page > 1,
      };
    }),

  setBenchmark: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        promptId: z.string().uuid(),
        isBenchmark: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (ctx.user.id !== prompt.authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the author can toggle benchmark status",
        });
      }

      await db
        .update(prompts)
        .set({ isBenchmark: input.isBenchmark, updatedAt: new Date() })
        .where(eq(prompts.id, input.promptId));

      return { success: true, isBenchmark: input.isBenchmark };
    }),

  listBenchmarks: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [
        eq(prompts.isBenchmark, true),
        isNull(prompts.hiddenAt),
      ];

      if (input.cursor) {
        conditions.push(sql`${prompts.id} < ${input.cursor}`);
      }

      const rows = await db.query.prompts.findMany({
        where: and(...conditions),
        columns: {
          id: true,
          title: true,
          content: true,
          themeId: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [desc(prompts.updatedAt)],
        limit: input.limit + 1,
        with: {
          theme: { columns: { id: true, title: true } },
          user: { columns: { id: true, name: true, image: true } },
        },
      });

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, -1) : rows;

      const promptIds = items.map((p) => p.id);

      const [gameCounts, modelCounts] = await Promise.all([
        promptIds.length > 0
          ? db
              .select({
                promptId: games.promptId,
                count: sql<number>`count(*)`,
              })
              .from(games)
              .where(
                and(
                  inArray(games.promptId, promptIds),
                  isNull(games.deletedAt),
                ),
              )
              .groupBy(games.promptId)
          : [],
        promptIds.length > 0
          ? db
              .select({
                promptId: games.promptId,
                modelCount: sql<number>`count(distinct ${games.modelName})`,
              })
              .from(games)
              .where(
                and(
                  inArray(games.promptId, promptIds),
                  isNull(games.deletedAt),
                ),
              )
              .groupBy(games.promptId)
          : [],
      ]);

      const gameCountMap = new Map(
        gameCounts.map((r) => [r.promptId, Number(r.count)]),
      );
      const modelCountMap = new Map(
        modelCounts.map((r) => [r.promptId, Number(r.modelCount)]),
      );

      return {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          theme: item.theme,
          author: item.user,
          gameCount: gameCountMap.get(item.id) ?? 0,
          modelCount: modelCountMap.get(item.id) ?? 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        nextCursor: hasMore
          ? (items[items.length - 1]?.id ?? null)
          : null,
      };
    }),

  getBenchmark: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
        with: {
          user: {
            columns: { name: true, image: true },
          },
          theme: {
            columns: { title: true },
          },
        },
      });

      if (!prompt || !prompt.isBenchmark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Benchmark not found",
        });
      }

      const rootPromptId = prompt.parentId ?? prompt.id;

      const allVersions = await db.query.prompts.findMany({
        where: or(
          eq(prompts.id, rootPromptId),
          eq(prompts.parentId, rootPromptId),
        ),
        columns: { id: true },
      });

      const promptIds = allVersions.map((p) => p.id);

      if (promptIds.length === 0) {
        return {
          prompt: {
            id: prompt.id,
            title: prompt.title,
            content: prompt.content,
            authorName: prompt.user?.name ?? null,
            authorImage: prompt.user?.image ?? null,
            themeTitle: prompt.theme?.title ?? null,
          },
          games: [],
        };
      }

      const result = await db
        .select({
          id: games.id,
          name: games.name,
          modelName: games.modelName,
          modelProvider: games.modelProvider,
          status: games.status,
          imageUrl: games.imageUrl,
          tierCostId: games.tierCostId,
          inputTokens: games.inputTokens,
          outputTokens: games.outputTokens,
          reasoningTokens: games.reasoningTokens,
          tokenUsage: games.tokenUsage,
          generationTimeMs: games.generationTimeMs,
          timeToFirstTokenMs: games.timeToFirstTokenMs,
          tokensPerSecond: games.tokensPerSecond,
          requestCostUsd: games.requestCostUsd,
          isSubmitted: games.isSubmitted,
          createdAt: games.createdAt,
          finalScore: scores.finalScore,
          tierSlug: tierCosts.slug,
          tierName: tierCosts.name,
          tierColorClass: tierCosts.colorClass,
        })
        .from(games)
        .leftJoin(scores, eq(games.id, scores.gameId))
        .innerJoin(tierCosts, eq(games.tierCostId, tierCosts.id))
        .where(
          and(
            inArray(games.promptId, promptIds),
            isNull(games.deletedAt),
            sql`${games.status} != 'generating'`,
          ),
        )
        .orderBy(games.modelName, desc(scores.finalScore));

      const gameIds = result.map((g) => g.id);

      const playStats =
        gameIds.length > 0
          ? await db
              .select({
                gameId: gameSessionMetrics.gameId,
                totalPlays: count(),
                uniquePlayers: count(
                  sql`DISTINCT ${gameSessionMetrics.userId}`,
                ),
              })
              .from(gameSessionMetrics)
              .where(
                and(
                  inArray(gameSessionMetrics.gameId, gameIds),
                  isNotNull(gameSessionMetrics.endedAt),
                ),
              )
              .groupBy(gameSessionMetrics.gameId)
          : [];

      const ratingsData =
        gameIds.length > 0
          ? await db
              .select({
                gameId: ratings.gameId,
                avgOverall: sql<string>`AVG(${ratings.overall})::numeric`,
                ratingCount: count(),
              })
              .from(ratings)
              .where(inArray(ratings.gameId, gameIds))
              .groupBy(ratings.gameId)
          : [];

      const highScores =
        gameIds.length > 0
          ? await db
              .select({
                gameId: gameScoresTable.gameId,
                highScore: sql<number>`MAX(${gameScoresTable.score})`,
              })
              .from(gameScoresTable)
              .where(
                and(
                  inArray(gameScoresTable.gameId, gameIds),
                  eq(gameScoresTable.isHighScore, true),
                ),
              )
              .groupBy(gameScoresTable.gameId)
          : [];

      const playStatsMap = new Map(
        playStats.map((s) => [
          s.gameId,
          { totalPlays: Number(s.totalPlays), uniquePlayers: Number(s.uniquePlayers) },
        ]),
      );
      const ratingsMap = new Map(
        ratingsData.map((r) => [
          r.gameId,
          {
            avgRating: r.avgOverall ? Number(r.avgOverall) : null,
            ratingCount: Number(r.ratingCount),
          },
        ]),
      );
      const highScoresMap = new Map(
        highScores.map((h) => [h.gameId, Number(h.highScore)]),
      );

      const benchmarkGames = result.map((game) => {
        const stats = playStatsMap.get(game.id) ?? {
          totalPlays: 0,
          uniquePlayers: 0,
        };
        const rating = ratingsMap.get(game.id) ?? {
          avgRating: null,
          ratingCount: 0,
        };

        return {
          id: game.id,
          name: game.name,
          modelName: game.modelName,
          modelProvider: game.modelProvider,
          status: game.status,
          imageUrl: game.imageUrl,
          tierSlug: game.tierSlug,
          tierName: game.tierName,
          tierColorClass: game.tierColorClass,
          inputTokens: game.inputTokens,
          outputTokens: game.outputTokens,
          reasoningTokens: game.reasoningTokens,
          tokenUsage: game.tokenUsage,
          generationTimeMs: game.generationTimeMs,
          timeToFirstTokenMs: game.timeToFirstTokenMs,
          tokensPerSecond: game.tokensPerSecond,
          requestCostUsd: game.requestCostUsd,
          isSubmitted: game.isSubmitted,
          createdAt: game.createdAt,
          finalScore: game.finalScore,
          totalPlays: stats.totalPlays,
          uniquePlayers: stats.uniquePlayers,
          avgRating: rating.avgRating,
          ratingCount: rating.ratingCount,
          highScore: highScoresMap.get(game.id) ?? null,
        };
      });

      return {
        prompt: {
          id: prompt.id,
          title: prompt.title,
          content: prompt.content,
          authorName: prompt.user?.name ?? null,
          authorImage: prompt.user?.image ?? null,
          themeTitle: prompt.theme?.title ?? null,
        },
        games: benchmarkGames,
      };
    }),
});
