import Redis from "ioredis";

export * from "ioredis";
export * from "./swr-cache";
export * from "./swr-cache-utils";

export const createRedisClient = (
  url: string,
  onConnect?: () => void,
  onError?: (error: unknown) => void
) => {
  const redis = new Redis(url, {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on(
    "error",
    onError ??
      ((error: any) => {
        console.error(`Redis Client Error: ${error}`);
      })
  );

  redis.on(
    "connect",
    onConnect ??
      (() => {
        console.info("Redis Client Connected");
      })
  );

  return redis;
};

export const defaultSWRCacheConfig = {
  ttl: 3600000, // Default time-to-live: 1 hour (in milliseconds)
  maxStaleAge: 7200000, // Default maximum stale age: 2 hours (in milliseconds)
  revalidateAfter: 1800000, // Default revalidation interval: 30 minutes (in milliseconds),
};
