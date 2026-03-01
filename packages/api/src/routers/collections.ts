import { router, protectedProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import {
  collectionGames,
  collections,
  COLLECTION_DESCRIPTION_MAX_LENGTH,
  COLLECTION_NAME_MAX_LENGTH,
  COLLECTION_NAME_MIN_LENGTH,
} from "@arcade-vibe/db/schema/collections";
import { games } from "@arcade-vibe/db/schema/games";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const createCollectionInput = z.object({
  name: z
    .string()
    .min(COLLECTION_NAME_MIN_LENGTH)
    .max(COLLECTION_NAME_MAX_LENGTH),
  description: z
    .string()
    .max(COLLECTION_DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
  isPublic: z.boolean().default(false),
});

const updateCollectionInput = z
  .object({
    id: z.string().uuid(),
    name: z
      .string()
      .min(COLLECTION_NAME_MIN_LENGTH)
      .max(COLLECTION_NAME_MAX_LENGTH)
      .optional(),
    description: z
      .string()
      .max(COLLECTION_DESCRIPTION_MAX_LENGTH)
      .optional()
      .nullable(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.description !== undefined ||
      input.isPublic !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

const collectionIdInput = z.object({
  id: z.string().uuid(),
});

const listPublicByUserInput = z.object({
  userId: z.string().min(1),
});

const collectionGameInput = z.object({
  collectionId: z.string().uuid(),
  gameId: z.string().uuid(),
});

async function getOwnedCollectionOrThrow(collectionId: string, userId: string) {
  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, userId)),
  });

  if (!collection) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Collection not found",
    });
  }

  return collection;
}

export const collectionsRouter = router({
  listPublicByUser: publicProcedure
    .input(listPublicByUserInput)
    .query(async ({ input }) => {
      return await db.query.collections.findMany({
        where: and(
          eq(collections.userId, input.userId),
          eq(collections.isPublic, true),
        ),
        orderBy: [desc(collections.updatedAt)],
        with: {
          collectionGames: {
            columns: {
              id: true,
            },
          },
        },
      });
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return await db.query.collections.findMany({
      where: eq(collections.userId, ctx.user.id),
      orderBy: [desc(collections.updatedAt)],
      with: {
        collectionGames: {
          columns: {
            id: true,
          },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(collectionIdInput)
    .query(async ({ ctx, input }) => {
      const collection = await getOwnedCollectionOrThrow(input.id, ctx.user.id);

      const items = await db.query.collectionGames.findMany({
        where: eq(collectionGames.collectionId, collection.id),
        orderBy: [desc(collectionGames.addedAt)],
      });

      const gameIds = items.map((item) => item.gameId);
      const gamesById =
        gameIds.length === 0
          ? new Map<string, never>()
          : new Map(
              (
                await db.query.games.findMany({
                  where: inArray(games.id, gameIds),
                  with: {
                    prompt: {
                      columns: {
                        id: true,
                        content: true,
                        visibility: true,
                        authorId: true,
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
                    tierCost: {
                      columns: {
                        slug: true,
                        name: true,
                      },
                    },
                  },
                })
              ).map((game) => [game.id, game]),
            );

      const sanitizedGames = items
        .map((item) => gamesById.get(item.gameId))
        .filter((game): game is NonNullable<typeof game> => game !== undefined)
        .map((game) => {
          const canViewPrompt =
            game.prompt.visibility === "public" ||
            game.prompt.authorId === ctx.user.id ||
            ctx.user.role === "admin" ||
            ctx.user.role === "moderator";

          if (canViewPrompt) {
            return game;
          }

          return {
            ...game,
            prompt: {
              ...game.prompt,
              content: "",
            },
          };
        });

      return {
        collection,
        games: sanitizedGames,
      };
    }),

  getPublicById: publicProcedure
    .input(collectionIdInput)
    .query(async ({ input }) => {
      const collection = await db.query.collections.findFirst({
        where: and(eq(collections.id, input.id), eq(collections.isPublic, true)),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Public collection not found",
        });
      }

      const collectionItems = await db.query.collectionGames.findMany({
        where: eq(collectionGames.collectionId, collection.id),
        orderBy: [desc(collectionGames.addedAt)],
      });

      const gameIds = collectionItems.map((item) => item.gameId);

      if (gameIds.length === 0) {
        return {
          collection,
          games: [],
        };
      }

      const rawGames = await db.query.games.findMany({
        where: and(
          inArray(games.id, gameIds),
          eq(games.status, "completed"),
          eq(games.isSubmitted, true),
          eq(games.isHidden, false),
          isNull(games.deletedAt),
        ),
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
          tierCost: {
            columns: {
              slug: true,
              name: true,
            },
          },
        },
      });

      const gameMap = new Map(rawGames.map((game) => [game.id, game]));

      const orderedGames = collectionItems
        .map((item) => gameMap.get(item.gameId))
        .filter((game): game is NonNullable<typeof game> => game !== undefined)
        .map((game) => {
          if (game.prompt.visibility === "public") {
            return game;
          }

          return {
            ...game,
            prompt: {
              ...game.prompt,
              content: "",
            },
          };
        });

      return {
        collection,
        games: orderedGames,
      };
    }),

  create: protectedProcedure
    .input(createCollectionInput)
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(collections)
        .values({
          userId: ctx.user.id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          isPublic: input.isPublic,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create collection",
        });
      }

      return created;
    }),

  update: protectedProcedure
    .input(updateCollectionInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedCollectionOrThrow(input.id, ctx.user.id);

      const [updated] = await db
        .update(collections)
        .set({
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {}),
          ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
        })
        .where(and(eq(collections.id, input.id), eq(collections.userId, ctx.user.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update collection",
        });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(collectionIdInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedCollectionOrThrow(input.id, ctx.user.id);

      await db
        .delete(collections)
        .where(and(eq(collections.id, input.id), eq(collections.userId, ctx.user.id)));

      return { success: true };
    }),

  addGame: protectedProcedure
    .input(collectionGameInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedCollectionOrThrow(input.collectionId, ctx.user.id);

      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        with: {
          prompt: {
            columns: {
              authorId: true,
            },
          },
        },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const isPublicGame =
        game.status === "completed" &&
        game.isSubmitted &&
        !game.isHidden &&
        game.deletedAt === null;
      const isOwnGame = game.prompt.authorId === ctx.user.id;
      const isModerator =
        ctx.user.role === "admin" || ctx.user.role === "moderator";

      if (!isPublicGame && !isOwnGame && !isModerator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot add this game to a collection",
        });
      }

      const inserted = await db
        .insert(collectionGames)
        .values({
          collectionId: input.collectionId,
          gameId: input.gameId,
        })
        .onConflictDoNothing({
          target: [collectionGames.collectionId, collectionGames.gameId],
        })
        .returning({
          id: collectionGames.id,
        });

      return {
        added: inserted.length > 0,
      };
    }),

  removeGame: protectedProcedure
    .input(collectionGameInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedCollectionOrThrow(input.collectionId, ctx.user.id);

      await db
        .delete(collectionGames)
        .where(
          and(
            eq(collectionGames.collectionId, input.collectionId),
            eq(collectionGames.gameId, input.gameId),
          ),
        );

      return {
        success: true,
      };
    }),
});
