import { NextRequest, NextResponse } from "next/server";
import { verifyGameSessionToken } from "@arcade-vibe/api/lib/game-session";
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
  token: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token = extractBearerToken(authHeader);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const input = parsed.data;

  if (!token && input.token) {
    token = input.token;
  }

  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const session = await verifyGameSessionToken(token);
  if (!session) {
    return NextResponse.json({ ok: true });
  }

  if (session.gameId !== input.gameId) {
    return NextResponse.json({ error: "Game ID mismatch" }, { status: 403 });
  }

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
    3600,
    JSON.stringify(sessionData),
  );

  return NextResponse.json({ ok: true });
}
