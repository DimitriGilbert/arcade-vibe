import jwt from "jsonwebtoken";
import { redis } from "./redis";

export interface GameSession {
  sessionId: string;
  userId: string;
  gameId: string;
  startedAt: number;
}

const getJwtSecret = (): string => {
  const secret = process.env.GAME_SDK_SECRET;
  if (!secret) {
    throw new Error("GAME_SDK_SECRET environment variable is not set");
  }
  return secret;
};

const SESSION_TTL_SECONDS = 3600; // 1 hour

export async function createGameSessionToken(
  userId: string,
  gameId: string,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const startedAt = Date.now();

  // Store session data in Redis
  const sessionData = {
    userId,
    gameId,
    startedAt,
    lastPlaytime: 0,
    lastHeartbeat: Date.now(),
  };

  await redis.setex(
    `game_session:${sessionId}`,
    SESSION_TTL_SECONDS,
    JSON.stringify(sessionData),
  );

  // Create and sign JWT token
  const tokenPayload: GameSession = {
    sessionId,
    userId,
    gameId,
    startedAt,
  };

  return jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: "1h" });
}

export async function verifyGameSessionToken(
  token: string,
): Promise<GameSession | null> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as GameSession;

    // Check if session still exists in Redis
    const sessionData = await redis.get(`game_session:${decoded.sessionId}`);

    if (!sessionData) {
      return null;
    }

    // Return session information
    return decoded;
  } catch {
    return null;
  }
}
