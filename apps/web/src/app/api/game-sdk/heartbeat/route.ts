import { NextRequest, NextResponse } from "next/server";
import { verifyGameSessionToken } from "@arcade-vibe/api/lib/game-session";
import { db } from "@arcade-vibe/db";
import { gameScores, gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import { suspiciousActivityLogs } from "@arcade-vibe/db/schema/security";
import { eq, and } from "drizzle-orm";
import { redis } from "@arcade-vibe/api/lib/redis";
import z from "zod";

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

const schema = z.object({
  gameId: z.string().uuid(),
  playtime: z.number().int().min(0),
  timestamp: z.number(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = extractBearerToken(authHeader);
  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const input = parsed.data;
  const session = await verifyGameSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  if (session.gameId !== input.gameId) {
    return NextResponse.json({ error: "Game ID mismatch" }, { status: 403 });
  }

  const wallClockElapsed = (Date.now() - session.startedAt) / 1000;
  const maxAllowedPlaytime = wallClockElapsed + 10;

  if (input.playtime > maxAllowedPlaytime) {
    await db.insert(suspiciousActivityLogs).values({
      userId: session.userId,
      gameId: input.gameId,
      activityType: "playtime_mismatch",
      details: {
        reported: input.playtime,
        maxAllowed: maxAllowedPlaytime,
        wallClockElapsed,
      },
      ipAddress: null,
      userAgent: null,
    });
  }

  if (input.playtime >= 60) {
    const existingScore = await db.query.gameScores.findFirst({
      where: and(
        eq(gameScores.userId, session.userId),
        eq(gameScores.gameId, input.gameId),
      ),
    });

    if (!existingScore) {
      await db.insert(gameScores).values({
        gameId: input.gameId,
        userId: session.userId,
        sessionId: session.sessionId,
        score: 0,
        completionTime: input.playtime,
      });
    }
  }

  const sessionData = {
    userId: session.userId,
    gameId: session.gameId,
    startedAt: session.startedAt,
    lastPlaytime: input.playtime,
    lastHeartbeat: Date.now(),
  };

  await redis.setex(
    `game_session:${session.sessionId}`,
    3600,
    JSON.stringify(sessionData),
  );

  if (!session.userId.startsWith("anonymous:")) {
    await db
      .insert(gameSessionMetrics)
      .values({
        sessionId: session.sessionId,
        gameId: input.gameId,
        userId: session.userId,
        startedAt: new Date(session.startedAt),
        playtimeSeconds: input.playtime,
        hasScoreEvent: false,
      })
      .onConflictDoUpdate({
        target: gameSessionMetrics.sessionId,
        set: {
          playtimeSeconds: input.playtime,
        },
      });
  }

  return NextResponse.json({ ok: true });
}
