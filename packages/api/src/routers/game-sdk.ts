import { router, publicProcedure } from "../index";
import { db } from "@arcade-vibe/db";
import { gameScores } from "@arcade-vibe/db/schema/games";
import { suspiciousActivityLogs } from "@arcade-vibe/db/schema/security";
import { redis } from "../lib/redis";
import { verifyGameSessionToken } from "../lib/game-session";
import { TRPCError } from "@trpc/server";
import z from "zod";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "../middleware/rate-limit";

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1] ?? null;
}

export const gameSdkRouter = router({
  /**
   * Heartbeat to track playtime
   * Called periodically (every 5 seconds) by the game client
   */
  heartbeat: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        playtime: z.number().int().min(0),
        timestamp: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.get("authorization");
      const token = extractBearerToken(authHeader);

      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization token",
        });
      }

      const session = await verifyGameSessionToken(token);

      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session token",
        });
      }

      // Validate that the game ID in the token matches the input
      if (session.gameId !== input.gameId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Game ID mismatch",
        });
      }

      // Calculate wall-clock elapsed time
      const wallClockElapsed = (Date.now() - session.startedAt) / 1000;
      const maxAllowedPlaytime = wallClockElapsed + 10; // 10 second tolerance

      // Check if reported playtime exceeds what's physically possible
      if (input.playtime > maxAllowedPlaytime) {
        // Log suspicious activity to database per PRD lines 396-402
        await db.insert(suspiciousActivityLogs).values({
          userId: session.userId,
          gameId: input.gameId,
          activityType: "playtime_mismatch",
          details: {
            reported: input.playtime,
            maxAllowed: maxAllowedPlaytime,
            wallClockElapsed,
          },
          ipAddress: ctx.req.headers.get("x-forwarded-for"),
          userAgent: ctx.req.headers.get("user-agent"),
        });
        // Continue processing but this is flagged for review
      }

      // Store updated session data in Redis
      const sessionData = {
        userId: session.userId,
        gameId: session.gameId,
        startedAt: session.startedAt,
        lastPlaytime: input.playtime,
        lastHeartbeat: Date.now(),
      };

      await redis.setex(
        `game_session:${session.sessionId}`,
        3600, // 1 hour expiry
        JSON.stringify(sessionData),
      );

      return { ok: true };
    }),

  /**
   * Submit score to leaderboard
   * Called when the player achieves a score during gameplay
   */
  score: publicProcedure
    .use(createRateLimitMiddleware(rateLimits.default))
    .input(
      z.object({
        gameId: z.string().uuid(),
        score: z.number().int().min(0),
        playtime: z.number().int().min(0),
        timestamp: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.get("authorization");
      const token = extractBearerToken(authHeader);

      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization token",
        });
      }

      const session = await verifyGameSessionToken(token);

      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session token",
        });
      }

      // Validate that the game ID in the token matches the input
      if (session.gameId !== input.gameId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Game ID mismatch",
        });
      }

      // Calculate wall-clock elapsed time
      const wallClockElapsed = (Date.now() - session.startedAt) / 1000;
      const validatedPlaytime = Math.min(
        input.playtime,
        wallClockElapsed + 10, // Cap at wall-clock + tolerance
      );

      // Insert score into database
      await db.insert(gameScores).values({
        gameId: input.gameId,
        userId: session.userId,
        score: input.score,
        completionTime: validatedPlaytime,
        playedAt: new Date(),
      });

      // Invalidate leaderboard cache for this game
      await redis.del(`game_leaderboard:${input.gameId}`);

      // Add score to Redis stream for real-time updates
      await redis.xadd(
        `game_scores:${input.gameId}`,
        "*",
        "score",
        input.score.toString(),
        "userId",
        session.userId,
      );

      return { ok: true };
    }),

  /**
   * End game session
   * Called when the player exits the game
   */
  endSession: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        playtime: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.get("authorization");
      const token = extractBearerToken(authHeader);

      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization token",
        });
      }

      const session = await verifyGameSessionToken(token);

      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session token",
        });
      }

      // Validate that the game ID in the token matches the input
      if (session.gameId !== input.gameId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Game ID mismatch",
        });
      }

      // Store final playtime in Redis
      const sessionData = {
        userId: session.userId,
        gameId: session.gameId,
        startedAt: session.startedAt,
        lastPlaytime: input.playtime,
        lastHeartbeat: Date.now(),
        endedAt: Date.now(),
      };

      await redis.setex(
        `game_session:${session.sessionId}`,
        3600, // Keep for 1 hour for reference
        JSON.stringify(sessionData),
      );

      return { ok: true };
    }),
});
