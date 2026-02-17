import {
  router,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
} from "../index";
import { db } from "@arcade-vibe/db";
import { games, gameVersions, GAME_NAME_MAX_LENGTH, GAME_NAME_MIN_LENGTH } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { gameScores } from "@arcade-vibe/db/schema/games";
import { eq, desc, and, lt, isNull, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createGameSessionToken } from "../lib/game-session";
import {
  generatePortableGameHtml,
  generatePortableFilename,
} from "../lib/game-export";
import { cacheGet, cacheSet } from "../lib/redis";
import { redis } from "../lib/redis";
import z from "zod";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ABANDONED_GAME_THRESHOLD_DAYS = 7;

/**
 * @security SDK_TEMPLATE - Sandboxed iframe HTML template
 *
 * This HTML is loaded into a sandboxed iframe for game execution.
 * The consumer MUST apply sandbox attributes when rendering this template.
 *
 * Recommended sandbox attributes:
 *   sandbox="allow-scripts allow-same-origin"
 *
 * - allow-scripts: Required for game functionality and SDK communication
 * - allow-same-origin: Required for fetch API calls to the backend
 *
 * DO NOT add: allow-forms, allow-popups, allow-top-navigation
 * These are not needed and would increase attack surface.
 */
const SDK_TEMPLATE = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
    </style>
    <script>
      (function () {
        "use strict";

        let SESSION_TOKEN = null;
        const API_ENDPOINT = "__ARCADE_VIBE_API_ENDPOINT__";
        const GAME_ID = "__ARCADE_VIBE_GAME_ID__";

        let sessionStart = Date.now();
        let lastHeartbeat = Date.now();
        let isSessionActive = true;

        // GL-007: Receive session token via postMessage from parent instead of embedding in HTML
        function handleSessionToken(event) {
          if (event.data && event.data.type === "ARCADE_VIBE_SESSION_TOKEN") {
            SESSION_TOKEN = event.data.token;
            window.removeEventListener("message", handleSessionToken);
          }
        }
        window.addEventListener("message", handleSessionToken);

        // Notify parent that SDK is ready to receive token
        window.parent.postMessage({ type: "ARCADE_VIBE_SDK_READY", gameId: GAME_ID }, "*");

        // Heartbeat for playtime tracking (every 5 seconds)
        const heartbeatInterval = setInterval(() => {
          if (!isSessionActive || !SESSION_TOKEN) return;
          const playtime = Math.floor((Date.now() - sessionStart) / 1000);

          fetch(\`\${API_ENDPOINT}/api/game-sdk/heartbeat\`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: \`Bearer \${SESSION_TOKEN}\`,
            },
            body: JSON.stringify({
              gameId: GAME_ID,
              playtime,
              timestamp: Date.now(),
            }),
          }).catch(() => {});

          lastHeartbeat = Date.now();
        }, 5000);

        // Public API
        window.ArcadeVibe = {
          reportScore(score) {
            if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
              console.warn("[ArcadeVibe] Invalid score. Must be a positive integer.");
              return;
            }
            if (!SESSION_TOKEN) {
              console.warn("[ArcadeVibe] Session not initialized. Waiting for token.");
              return;
            }

            const playtime = Math.floor((Date.now() - sessionStart) / 1000);

            fetch(\`\${API_ENDPOINT}/api/game-sdk/score\`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: \`Bearer \${SESSION_TOKEN}\`,
              },
              body: JSON.stringify({
                gameId: GAME_ID,
                score,
                playtime,
                timestamp: Date.now(),
              }),
            }).catch(() => {
              console.warn("[ArcadeVibe] Failed to submit score.");
            });
          },

          getPlaytime() {
            return Math.floor((Date.now() - sessionStart) / 1000);
          },

          isReady() {
            return SESSION_TOKEN !== null;
          },
        };

        window.addEventListener("beforeunload", () => {
          isSessionActive = false;
          clearInterval(heartbeatInterval);

          if (!SESSION_TOKEN) return;
          const playtime = Math.floor((Date.now() - sessionStart) / 1000);
          navigator.sendBeacon(
            \`\${API_ENDPOINT}/api/game-sdk/end-session\`,
            JSON.stringify({
              gameId: GAME_ID,
              token: SESSION_TOKEN,
              playtime,
            }),
          );
        });
      })();
    </script>
  </head>
  <body>
    <!-- AI-generated game code -->
    __GAME_CODE__
  </body>
</html>`;

export const gamesRouter = router({
  /**
   * Get game by ID
   * Public access if status = 'completed'
   * Private access if user is the prompt author or admin
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: eq(games.id, input.id),
        with: {
          prompt: {
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
              description: true,
              status: true,
              visibility: true,
              startDate: true,
              endDate: true,
              mediaConfig: true,
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

      // Check access permissions
      const isPublic = game.status === "completed" && !game.isHidden;
      const isAuthor = ctx.user?.id === game.prompt.user?.id;
      const isAdmin =
        ctx.user?.role === "admin" || ctx.user?.role === "moderator";

      if (!isPublic && !isAuthor && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this game",
        });
      }

      return game;
    }),

  /**
   * List all games for a prompt
   * Only includes non-hidden games
   * Supports pagination
   */
  listByPrompt: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const cacheKey = `games:prompt:${input.promptId}:${input.limit}:${input.offset}`;
      const cached = await cacheGet<typeof result>(cacheKey);
      if (cached) {
        return cached;
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const result = await gamesQuery.findMany({
        where: and(
          eq(games.promptId, input.promptId),
          eq(games.isHidden, false),
        ),
        orderBy: [desc(games.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          prompt: {
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
          theme: true,
        },
      });

      await cacheSet(cacheKey, result, 60); // Cache for 1 minute
      return result;
    }),

  /**
   * List games for a theme
   * Can filter for submitted games only
   * Only includes non-hidden games
   * Supports cursor-based pagination
   */
  listByTheme: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        includeSubmitted: z.boolean().default(true),
        limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }) => {
      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const whereConditions = [
        eq(games.themeId, input.themeId),
        eq(games.isHidden, false),
      ];

      if (input.includeSubmitted) {
        whereConditions.push(eq(games.isSubmitted, true));
      }

      // If cursor provided, get the cursor game's createdAt for pagination
      let cursorDate: Date | null = null;
      if (input.cursor) {
        const cursorGame = await gamesQuery.findFirst({
          where: eq(games.id, input.cursor),
          columns: { createdAt: true },
        });
        if (cursorGame) {
          cursorDate = cursorGame.createdAt;
        }
      }

      // Add cursor condition if we have one
      if (cursorDate) {
        const { lt } = await import("drizzle-orm");
        whereConditions.push(lt(games.createdAt, cursorDate));
      }

      // Fetch one extra to determine if there are more results
      const result = await gamesQuery.findMany({
        where: and(...whereConditions),
        orderBy: [desc(games.createdAt)],
        limit: input.limit + 1,
        with: {
          prompt: {
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
          theme: true,
          tierCost: {
            columns: {
              slug: true,
            },
          },
        },
      });

      // Check if there are more results
      const hasMore = result.length > input.limit;
      const games_result = hasMore ? result.slice(0, input.limit) : result;
      const nextCursor = hasMore
        ? games_result[games_result.length - 1]?.id
        : undefined;

      return {
        games: games_result,
        nextCursor,
        hasMore,
      };
    }),

  listByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        cursor: z.string().uuid().optional(),
        isSubmitted: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const promptsQuery = db.query.prompts;
      if (!promptsQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const userPrompts = await promptsQuery.findMany({
        where: eq(prompts.authorId, input.userId),
        columns: { id: true },
      });

      const promptIds = userPrompts.map((p) => p.id);

      if (promptIds.length === 0) {
        return { games: [], nextCursor: undefined, hasMore: false };
      }

      const whereConditions = [
        inArray(games.promptId, promptIds),
        eq(games.isHidden, false),
        isNull(games.deletedAt),
        ...(input.isSubmitted !== undefined ? [eq(games.isSubmitted, input.isSubmitted)] : []),
      ];

      let cursorDate: Date | null = null;
      if (input.cursor) {
        const cursorGame = await gamesQuery.findFirst({
          where: eq(games.id, input.cursor),
          columns: { createdAt: true },
        });
        if (cursorGame) {
          cursorDate = cursorGame.createdAt;
        }
      }

      if (cursorDate) {
        whereConditions.push(lt(games.createdAt, cursorDate));
      }

      const result = await gamesQuery.findMany({
        where: and(...whereConditions),
        orderBy: [desc(games.createdAt)],
        limit: input.limit + 1,
        with: {
          prompt: {
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
          theme: true,
          tierCost: {
            columns: {
              slug: true,
            },
          },
        },
      });

      const hasMore = result.length > input.limit;
      const games_result = hasMore ? result.slice(0, input.limit) : result;
      const nextCursor = hasMore
        ? games_result[games_result.length - 1]?.id
        : undefined;

      return {
        games: games_result,
        nextCursor,
        hasMore,
      };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: eq(games.id, input.gameId),
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                },
              },
            },
          },
          theme: true,
        },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      // Verify user is the prompt author
      if (game.prompt.user?.id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only submit games for your own prompts",
        });
      }

      // Verify game is completed
      if (game.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game must be completed before submitting",
        });
      }

      // Check if already submitted
      if (game.isSubmitted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game has already been submitted",
        });
      }

      // Validate theme status for competition integrity
      if (!game.theme) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game must be associated with a theme to submit",
        });
      }

      if (game.theme.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit game to a theme that is not active",
        });
      }

      // Validate theme date range if dates are set
      const now = new Date();
      if (game.theme.startDate && now < game.theme.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Theme submission period has not started yet",
        });
      }
      if (game.theme.endDate && now > game.theme.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Theme submission period has ended",
        });
      }

      // Mark game as submitted
      const updated = await db
        .update(games)
        .set({
          isSubmitted: true,
          submittedAt: new Date(),
        })
        .where(eq(games.id, input.gameId))
        .returning();

      // Invalidate caches
      await cacheDeletePattern(`games:theme:*`);
      await cacheDeletePattern(`games:prompt:*`);

      return {
        success: true,
        gameId: updated[0]?.id,
        submittedAt: updated[0]?.submittedAt,
      };
    }),

  /**
   * Update game details (name)
   * User must be the prompt author
   */
  update: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        name: z.string().min(GAME_NAME_MIN_LENGTH).max(GAME_NAME_MAX_LENGTH).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: and(eq(games.id, input.gameId), isNull(games.deletedAt)),
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                },
              },
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

      if (game.prompt.user?.id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update games for your own prompts",
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      const currentVersion = await db
        .select({ version: gameVersions.version })
        .from(gameVersions)
        .where(eq(gameVersions.gameId, input.gameId))
        .orderBy(desc(gameVersions.version))
        .limit(1);

      const nextVersion = (currentVersion[0]?.version ?? 0) + 1;

      const updated = await db.transaction(async (tx) => {
        await tx.insert(gameVersions).values({
          gameId: input.gameId,
          version: nextVersion,
          name: game.name,
          gameData: game.gameData,
          strudelCode: game.strudelCode,
          mediaUrls: game.mediaUrls,
          changedBy: ctx.user.id,
          changeReason: "User update",
        });

        const [updatedGame] = await tx
          .update(games)
          .set(updateData)
          .where(eq(games.id, input.gameId))
          .returning();

        return updatedGame;
      });

      await cacheDeletePattern(`games:theme:*`);
      await cacheDeletePattern(`games:prompt:*`);
      await cacheDelete(`game:${input.gameId}`);

      return {
        success: true,
        game: updated,
        version: nextVersion,
      };
    }),

  /**
   * Update game media (strudel code and media URLs)
   * User must be the prompt author
   */
  updateMedia: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        strudelCode: z.string().nullable().optional(),
        mediaUrls: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: eq(games.id, input.gameId),
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                },
              },
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

      if (game.prompt.user?.id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update media for your own games",
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.strudelCode !== undefined) {
        updateData.strudelCode = input.strudelCode;
      }

      if (input.mediaUrls !== undefined) {
        updateData.mediaUrls = input.mediaUrls;
      }

      const updated = await db
        .update(games)
        .set(updateData)
        .where(eq(games.id, input.gameId))
        .returning();

      await cacheDeletePattern(`games:theme:*`);
      await cacheDeletePattern(`games:prompt:*`);
      await cacheDelete(`game:${input.gameId}`);

      return {
        success: true,
        game: updated[0],
      };
    }),

  /**
   * Hide a game (admin/moderator only)
   */
  hide: moderatorProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: eq(games.id, input.gameId),
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      // Update game as hidden
      const updated = await db
        .update(games)
        .set({
          isHidden: true,
          hiddenReason: input.reason,
          hiddenAt: new Date(),
        })
        .where(eq(games.id, input.gameId))
        .returning();

      // Invalidate caches
      await cacheDeletePattern(`games:theme:*`);
      await cacheDeletePattern(`games:prompt:*`);
      await cacheDelete(`game:${input.gameId}`);

      return {
        success: true,
        gameId: updated[0]?.id,
        hiddenAt: updated[0]?.hiddenAt,
      };
    }),

  /**
   * Get game HTML/JS for iframe with SDK injection
   * Requires authentication (owner or public completed game)
   */
  getCode: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: eq(games.id, input.gameId),
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                },
              },
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

      // Check access permissions
      const isPublic = game.status === "completed" && !game.isHidden;
      const isAuthor = ctx.user.id === game.prompt.user?.id;
      const isAdmin =
        ctx.user.role === "admin" || ctx.user.role === "moderator";

      if (!isPublic && !isAuthor && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this game",
        });
      }

      // Get game data
      if (!game.gameData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game data not available",
        });
      }

      // Create game session token
      const sessionToken = await createGameSessionToken(ctx.user.id, game.id);

      // Get API endpoint from environment
      const apiEndpoint =
        process.env.NEXT_PUBLIC_API_URL || "https://api.arcade-vibe.com";

      // Inject SDK script into game HTML (token NOT embedded - passed via postMessage)
      const gameHtml = SDK_TEMPLATE.replace(
        "__ARCADE_VIBE_API_ENDPOINT__",
        apiEndpoint,
      )
        .replace("__ARCADE_VIBE_GAME_ID__", game.id)
        .replace("__GAME_CODE__", game.gameData);

      /**
       * @security Session token is returned ONLY in response body - NOT embedded in HTML
       * @security The parent page must pass the token to the iframe via postMessage:
       *   iframe.contentWindow.postMessage({
       *     type: "ARCADE_VIBE_SESSION_TOKEN",
       *     token: sessionToken
       *   }, "*");
       * @security HTTPS is REQUIRED in production - tokens must not be transmitted over plain HTTP
       * @security Treat sessionToken as sensitive session data - do not log or expose
       */
      return {
        html: gameHtml,
        gameId: game.id,
        sessionToken,
      };
    }),

  softDelete: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: and(eq(games.id, input.gameId), isNull(games.deletedAt)),
        with: {
          prompt: {
            with: {
              user: {
                columns: { id: true },
              },
            },
          },
        },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found or already deleted",
        });
      }

      const isAuthor = game.prompt.user?.id === ctx.user.id;
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "moderator";

      if (!isAuthor && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own games",
        });
      }

      const [existingRatings] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(eq(ratings.gameId, input.gameId));

      const [existingScores] = await db
        .select({ count: sql<number>`count(*)` })
        .from(gameScores)
        .where(eq(gameScores.gameId, input.gameId));

      const hasDependencies = 
        (existingRatings?.count ?? 0) > 0 || 
        (existingScores?.count ?? 0) > 0;

      if (hasDependencies && game.isSubmitted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a submitted game with ratings or scores. Contact support.",
        });
      }

      const updated = await db
        .update(games)
        .set({
          deletedAt: new Date(),
          isHidden: true,
          hiddenReason: "User deleted",
        })
        .where(eq(games.id, input.gameId))
        .returning();

      await cacheDeletePattern(`games:theme:*`);
      await cacheDeletePattern(`games:prompt:*`);
      await cacheDelete(`game:${input.gameId}`);

      return {
        success: true,
        gameId: updated[0]?.id,
        deletedAt: updated[0]?.deletedAt,
      };
    }),

  cleanupAbandoned: moderatorProcedure
    .input(
      z.object({
        dryRun: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - ABANDONED_GAME_THRESHOLD_DAYS);

      const abandonedGames = await db.query.games.findMany({
        where: and(
          sql`${games.status} IN ('generating', 'failed')`,
          lt(games.createdAt, thresholdDate),
          isNull(games.deletedAt),
        ),
        columns: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      if (input.dryRun) {
        return {
          dryRun: true,
          count: abandonedGames.length,
          games: abandonedGames,
        };
      }

      if (abandonedGames.length === 0) {
        return {
          dryRun: false,
          count: 0,
          games: [],
        };
      }

      const gameIds = abandonedGames.map((g) => g.id);

      await db
        .update(games)
        .set({
          deletedAt: new Date(),
          isHidden: true,
          hiddenReason: "Auto-cleanup: abandoned game",
        })
        .where(sql`${games.id} IN ${gameIds}`);

      await cacheDeletePattern(`games:theme:*`);
      await cacheDeletePattern(`games:prompt:*`);

      return {
        dryRun: false,
        count: abandonedGames.length,
        games: abandonedGames,
      };
    }),

  getVersionHistory: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        with: {
          prompt: {
            with: {
              user: {
                columns: { id: true },
              },
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

      const isPublic = game.status === "completed" && !game.isHidden;
      const isAuthor = ctx.user.id === game.prompt.user?.id;
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "moderator";

      if (!isPublic && !isAuthor && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this game's history",
        });
      }

      const versions = await db.query.gameVersions.findMany({
        where: eq(gameVersions.gameId, input.gameId),
        orderBy: [desc(gameVersions.version)],
        limit: input.limit,
        offset: input.offset,
        with: {
          changedByUser: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return versions;
    }),

  exportPortable: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const gamesQuery = db.query.games;
      if (!gamesQuery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query not available",
        });
      }

      const game = await gamesQuery.findFirst({
        where: eq(games.id, input.gameId),
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (game.status !== "completed" || game.isHidden) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This game is not available for export",
        });
      }

      if (!game.gameData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game data not available",
        });
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://arcade-vibe.com";
      const html = generatePortableGameHtml(
        { id: game.id, name: game.name, gameData: game.gameData },
        baseUrl,
      );
      const filename = generatePortableFilename({
        id: game.id,
        name: game.name,
        gameData: game.gameData,
      });

      return { html, filename };
    }),
});

async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}
