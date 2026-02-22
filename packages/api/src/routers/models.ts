import { router, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { games } from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { z } from "zod";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const modelsRouter = router({
  listActive: publicProcedure.query(async () => {
    const activeModels = await db.query.modelConfig.findMany({
      where: eq(modelConfig.isActive, true),
      orderBy: [desc(modelConfig.modelCreatedAt)],
      with: {
        tierCost: true,
        providers: true,
      },
    });

    return activeModels.map((model) => ({
      id: model.id,
      providers: model.providers.map((p) => p.provider),
      modelName: model.modelName,
      tier: model.tierCost?.slug ?? "unknown",
      tierName: model.tierCost?.name ?? "Unknown",
      maxTokens: model.maxTokens,
      supportsImages: model.supportsImages,
    }));
  }),

  getModelMetadata: publicProcedure.query(async () => {
    const [activeModels, allTierCosts] = await Promise.all([
      db.query.modelConfig.findMany({
        where: eq(modelConfig.isActive, true),
        orderBy: [desc(modelConfig.modelCreatedAt)],
        with: {
          tierCost: true,
          providers: true,
        },
      }),
      db.query.tierCosts.findMany({
        where: eq(tierCosts.isActive, true),
        orderBy: [asc(tierCosts.displayOrder)],
      }),
    ]);

    const tierCostsMap: Record<string, number> = {};
    for (const tc of allTierCosts) {
      tierCostsMap[tc.slug] = tc.creditCost;
    }

    const allProviders = new Set<string>();
    for (const model of activeModels) {
      for (const p of model.providers) {
        allProviders.add(p.provider);
      }
    }

    return {
      models: activeModels.map((model) => ({
        id: model.id,
        providers: model.providers.map((p) => p.provider),
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
      })),
      tierCosts: tierCostsMap,
      tierCostsArray: allTierCosts.map((tc) => ({
        id: tc.id,
        slug: tc.slug,
        name: tc.name,
        creditCost: tc.creditCost,
        description: tc.description,
        scoreMultiplier: tc.scoreMultiplier,
        displayOrder: tc.displayOrder,
        colorClass: tc.colorClass,
      })),
      providers: [...allProviders].sort(),
      tiers: allTierCosts.map((tc) => tc.slug),
    };
  }),

  getByName: publicProcedure
    .input(
      z.object({
        modelName: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.modelName, input.modelName),
        with: {
          tierCost: true,
          providers: true,
        },
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      return {
        id: model.id,
        providers: model.providers.map((p) => p.provider),
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
      };
    }),

  listWithStats: publicProcedure.query(async () => {
    const [activeModels, statsRows] = await Promise.all([
      db.query.modelConfig.findMany({
        where: eq(modelConfig.isActive, true),
        orderBy: [desc(modelConfig.modelCreatedAt)],
        with: {
          tierCost: true,
          providers: true,
        },
      }),
      db
        .select({
          modelName: games.modelName,
          gameCount: sql<number>`count(distinct ${games.id})`,
          ratingCount: count(ratings.id),
          avgRating: sql<string | null>`avg(${ratings.overall})`,
        })
        .from(games)
        .leftJoin(ratings, eq(ratings.gameId, games.id))
        .where(
          and(
            eq(games.status, "completed"),
            eq(games.isHidden, false),
            isNull(games.deletedAt),
          ),
        )
        .groupBy(games.modelName),
    ]);

    const statsByModelName = new Map(
      statsRows.map((row) => [
        row.modelName,
        {
          gameCount: Number(row.gameCount ?? 0),
          ratingCount: Number(row.ratingCount ?? 0),
          avgRating: row.avgRating ? Number(row.avgRating) : 0,
        },
      ]),
    );

    return activeModels.map((model) => {
      const stats = statsByModelName.get(model.modelName);

      return {
        id: model.id,
        providers: model.providers.map((p) => p.provider),
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
        gameCount: stats?.gameCount ?? 0,
        ratingCount: stats?.ratingCount ?? 0,
        avgRating: stats?.avgRating ?? 0,
      };
    });
  }),

  getByIdWithStats: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.id),
        with: {
          tierCost: true,
          providers: true,
        },
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      const [statsRow] = await db
        .select({
          gameCount: sql<number>`count(distinct ${games.id})`,
          ratingCount: count(ratings.id),
          avgRating: sql<string | null>`avg(${ratings.overall})`,
        })
        .from(games)
        .leftJoin(ratings, eq(ratings.gameId, games.id))
        .where(
          and(
            eq(games.modelName, model.modelName),
            eq(games.status, "completed"),
            eq(games.isHidden, false),
            isNull(games.deletedAt),
          ),
        );

      return {
        id: model.id,
        providers: model.providers.map((p) => p.provider),
        modelName: model.modelName,
        tier: model.tierCost?.slug ?? "unknown",
        tierName: model.tierCost?.name ?? "Unknown",
        maxTokens: model.maxTokens,
        supportsImages: model.supportsImages,
        gameCount: Number(statsRow?.gameCount ?? 0),
        ratingCount: Number(statsRow?.ratingCount ?? 0),
        avgRating: statsRow?.avgRating ? Number(statsRow.avgRating) : 0,
      };
    }),

  listGamesByModel: publicProcedure
    .input(
      z.object({
        modelId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(30),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const model = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.modelId),
        columns: {
          modelName: true,
        },
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      const modelGames = await db.query.games.findMany({
        where: and(
          eq(games.modelName, model.modelName),
          eq(games.status, "completed"),
          eq(games.isHidden, false),
          isNull(games.deletedAt),
          eq(games.isSubmitted, true),
        ),
        orderBy: [desc(games.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          prompt: {
            columns: {
              id: true,
              content: true,
              visibility: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          theme: {
            columns: {
              id: true,
              title: true,
            },
          },
          ratings: {
            columns: {
              overall: true,
            },
          },
        },
      });

      return modelGames.map((game) => {
        const ratingCount = game.ratings.length;
        const avgRating =
          ratingCount === 0
            ? 0
            : game.ratings.reduce((sum, rating) => sum + rating.overall, 0) /
              ratingCount;
        const isPromptPublic = game.prompt?.visibility === "public";

        return {
          id: game.id,
          name: game.name,
          createdAt: game.createdAt,
          theme: game.theme,
          author: game.prompt?.user ?? null,
          ratingCount,
          avgRating,
          promptId: game.prompt?.id ?? null,
          promptContent: isPromptPublic ? game.prompt?.content ?? null : null,
          promptVisibility: game.prompt?.visibility ?? null,
        };
      });
    }),
});
