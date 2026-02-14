import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
const isRedisDisabled =
  process.env.DISABLE_REDIS === "1" ||
  process.env.DISABLE_REDIS === "true" ||
  !redisUrl;

let redisClient: Redis | null = null;

const createRedisClient = (): Redis | null => {
  if (isRedisDisabled || !redisUrl) {
    return null;
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

const getRedis = (): Redis | null => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

const nullRedis = {
  get: async () => null,
  set: async () => "OK",
  setex: async () => "OK",
  del: async () => 0,
  incr: async () => 1,
  expire: async () => 1,
  ttl: async () => -1,
  keys: async () => [],
  scan: async () => ["0", []] as [string, string[]],
  xadd: async () => "0-0",
  xread: async () => null,
} as unknown as Redis;

export const redis: Redis = isRedisDisabled
  ? nullRedis
  : new Proxy({} as Redis, {
      get(_target, prop, receiver) {
        const client = getRedis();
        if (!client) return nullRedis;
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
      },
    });

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> => {
  if (isRedisDisabled) return;

  const client = getRedis();
  if (!client) return;

  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await client.setex(key, ttlSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (isRedisDisabled) return null;

  const client = getRedis();
  if (!client) return null;

  const value = await client.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  if (isRedisDisabled) return;

  const client = getRedis();
  if (!client) return;

  await client.del(key);
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  if (isRedisDisabled) return;

  const client = getRedis();
  if (!client) return;

  let cursor = "0";
  do {
    const [nextCursor, keys] = await client.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } while (cursor !== "0");
};

export const isRedisAvailable = (): boolean => !isRedisDisabled;
