import {
  router,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
} from "../index";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createGameSessionToken } from "../lib/game-session";
import { cacheGet, cacheSet } from "../lib/redis";
import { redis } from "../lib/redis";
import z from "zod";

// Arcade Vibe SDK template to be injected into game iframe
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

        const SESSION_TOKEN = "__ARCADE_VIBE_SESSION_TOKEN__";
        const API_ENDPOINT = "__ARCADE_VIBE_API_ENDPOINT__";
        const GAME_ID = "__ARCADE_VIBE_GAME_ID__";

        let sessionStart = Date.now();
        let lastHeartbeat = Date.now();
        let isSessionActive = true;

        // Heartbeat for playtime tracking (every 5 seconds)
        const heartbeatInterval = setInterval(() => {
          if (!isSessionActive) return;
          const playtime = Math.floor((Date.now() - sessionStart) / 1000);

          fetch(\`\${API_ENDPOINT}/game-sdk/heartbeat\`, {
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

            const playtime = Math.floor((Date.now() - sessionStart) / 1000);

            fetch(\`\${API_ENDPOINT}/game-sdk/score\`, {
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
            return SESSION_TOKEN !== "__ARCADE_VIBE_SESSION_TOKEN__";
          },
        };

        window.addEventListener("beforeunload", () => {
          isSessionActive = false;
          clearInterval(heartbeatInterval);

          const playtime = Math.floor((Date.now() - sessionStart) / 1000);
          navigator.sendBeacon(
            \`\${API_ENDPOINT}/game-sdk/end-session\`,
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
                  email: true,
                  image: true,
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
        limit: z.number().int().min(1).max(100).default(50),
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
                  email: true,
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
   */
  listByTheme: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        includeSubmitted: z.boolean().default(true),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const cacheKey = `games:theme:${input.themeId}:${input.includeSubmitted}:${input.limit}`;
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

      const whereConditions = [
        eq(games.themeId, input.themeId),
        eq(games.isHidden, false),
      ];

      // Only include submitted games if requested
      if (input.includeSubmitted) {
        whereConditions.push(eq(games.isSubmitted, true));
      }

      const result = await gamesQuery.findMany({
        where: and(...whereConditions),
        orderBy: [desc(games.createdAt)],
        limit: input.limit,
        with: {
          prompt: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
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

      await cacheSet(cacheKey, result, 60); // Cache for 1 minute
      return result;
    }),

  /**
   * Submit a game as an official competition entry
   * User must be the prompt author
   * Game must be completed
   */
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
      const isAuthor = ctx.user.id === game.prompt.authorId;
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

      // Inject SDK script into game HTML
      const gameHtml = SDK_TEMPLATE.replace(
        "__ARCADE_VIBE_SESSION_TOKEN__",
        sessionToken,
      )
        .replace("__ARCADE_VIBE_API_ENDPOINT__", apiEndpoint)
        .replace("__ARCADE_VIBE_GAME_ID__", game.id)
        .replace("__GAME_CODE__", game.gameData);

      return {
        html: gameHtml,
        gameId: game.id,
        sessionToken,
      };
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
