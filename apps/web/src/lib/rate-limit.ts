import { NextRequest, NextResponse } from "next/server";
import { redis } from "@arcade-vibe/api/lib/redis";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export const rateLimits = {
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: "ratelimit:api:strict",
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: "ratelimit:api:default",
  },
  loose: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: "ratelimit:api:loose",
  },
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check rate limit for an API route
 * @param identifier - User ID, IP address, or other unique identifier
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and remaining requests
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }

    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, config.maxRequests - current);

    return {
      success: current <= config.maxRequests,
      remaining,
      resetIn: ttl,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // On error, allow the request through
    return {
      success: true,
      remaining: config.maxRequests,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }
}

/**
 * Extract identifier from request for rate limiting
 * Prioritizes user ID from headers, falls back to IP address
 */
export function getRateLimitIdentifier(req: NextRequest): string {
  // Try to get user ID from custom header (set by auth middleware)
  const userId = req.headers.get("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    const ip = forwardedFor.split(",")[0]?.trim() ?? "unknown";
    return `ip:${ip}`;
  }

  if (realIp) {
    return `ip:${realIp}`;
  }

  return "anonymous";
}

/**
 * Create a rate limit response for exceeded limits
 */
export function createRateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: "Rate limit exceeded", retryAfter: resetIn },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetIn),
        "X-RateLimit-Reset": String(resetIn),
      },
    },
  );
}

/**
 * Higher-order function to wrap an API route handler with rate limiting
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const identifier = getRateLimitIdentifier(req);
    const result = await checkRateLimit(identifier, config);

    if (!result.success) {
      return createRateLimitResponse(result.resetIn);
    }

    const response = await handler(req);

    // Add rate limit headers to response
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetIn));

    return response;
  };
}
