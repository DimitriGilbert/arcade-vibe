import { NextRequest, NextResponse } from "next/server";
import { verifyGameSessionToken } from "@arcade-vibe/api/lib/game-session";
import { db } from "@arcade-vibe/db";
import { gameSessionMetrics } from "@arcade-vibe/db/schema/games";
import z from "zod";

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

const schema = z.object({
  gameId: z.string().uuid(),
  timestamp: z.number().optional(),
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

  if (session.userId.startsWith("anonymous:")) {
    return NextResponse.json({ ok: true });
  }

  await db
    .insert(gameSessionMetrics)
    .values({
      sessionId: session.sessionId,
      gameId: input.gameId,
      userId: session.userId,
      startedAt: new Date(input.timestamp ?? Date.now()),
      playtimeSeconds: 0,
      hasScoreEvent: false,
    })
    .onConflictDoUpdate({
      target: gameSessionMetrics.sessionId,
      set: {
        startedAt: new Date(input.timestamp ?? Date.now()),
      },
    });

  return NextResponse.json({ ok: true });
}
