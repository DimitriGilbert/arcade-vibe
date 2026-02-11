import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
const isRedisDisabled =
  process.env.DISABLE_REDIS === "1" ||
  process.env.DISABLE_REDIS === "true" ||
  !redisUrl;

let redisClient: Redis | null = null;

const createRedisClient = (): Redis => {
  if (isRedisDisabled) {
    throw new Error(
      "Redis is disabled. Set REDIS_URL to enable or remove DISABLE_REDIS.",
    );
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on("error", (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] connection error", error);
    }
  });

  return client;
};

const getRedis = (): Redis => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

export const redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    const client = getRedis();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> => {
  const serialized = JSON.stringify(value);
  const client = getRedis();
  if (ttlSeconds) {
    await client.setex(key, ttlSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const value = await getRedis().get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  await getRedis().del(key);
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  let cursor = "0";
  do {
    const [nextCursor, keys] = await getRedis().scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await getRedis().del(...keys);
    }
  } while (cursor !== "0");
};
