import { NextRequest, NextResponse } from "next/server";
import { verifyGameSessionToken } from "@arcade-vibe/api/lib/game-session";
import { db } from "@arcade-vibe/db";
import { gameScores } from "@arcade-vibe/db/schema/games";
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
  score: z.number().int().min(0),
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
  const validatedPlaytime = Math.min(input.playtime, wallClockElapsed + 10);

  await db
    .insert(gameScores)
    .values({
      gameId: input.gameId,
      userId: session.userId,
      sessionId: session.sessionId,
      score: input.score,
      completionTime: validatedPlaytime,
      playedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: gameScores.sessionId,
      set: {
        score: input.score,
        completionTime: validatedPlaytime,
        playedAt: new Date(),
      },
    });

  await redis.del(`game_leaderboard:${input.gameId}`);

  await redis.xadd(
    `game_scores:${input.gameId}`,
    "*",
    "score",
    input.score.toString(),
    "userId",
    session.userId,
  );

  return NextResponse.json({ ok: true });
}
