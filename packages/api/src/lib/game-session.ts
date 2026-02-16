import jwt from "jsonwebtoken";
import { redis, isRedisAvailable } from "./redis";

export interface GameSession {
  sessionId: string;
  userId: string;
  gameId: string;
  startedAt: number;
  endedAt?: number;
}

const getJwtSecret = (): string => {
  const secret = process.env.GAME_SDK_SECRET;
  if (!secret) {
    throw new Error("GAME_SDK_SECRET environment variable is not set");
  }
  return secret;
};

const SESSION_TTL_SECONDS = 3600; // 1 hour

/**
 * Create a game session token
 *
 * @requirement Redis is REQUIRED for production game session management
 * @security Without Redis, sessions cannot be revoked and replay attacks are possible
 *
 * The session flow:
 * 1. JWT is created and returned to client
 * 2. Session data is stored in Redis with TTL
 * 3. On verify, both JWT signature AND Redis session existence are checked
 * 4. If Redis is unavailable, only JWT validation occurs (less secure)
 *
 * For production deployments, ensure REDIS_URL is configured and Redis is highly available.
 */

export async function createGameSessionToken(
  userId: string,
  gameId: string,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const startedAt = Date.now();

  if (isRedisAvailable()) {
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
  }

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
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as GameSession;

    if (decoded.endedAt !== undefined && decoded.endedAt < Date.now()) {
      return null;
    }

    if (isRedisAvailable()) {
      const sessionData = await redis.get(`game_session:${decoded.sessionId}`);
      if (!sessionData) {
        return null;
      }
    }

    return decoded;
  } catch {
    return null;
  }
}
