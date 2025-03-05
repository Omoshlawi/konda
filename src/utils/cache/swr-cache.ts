import { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";
import { Logger } from "winston";

interface CacheConfig {
  redis: Redis;
  ttl: number; // Time-to-live in seconds
  staleTime: number; // Time before data is considered stale in seconds
  lockTimeout?: number; // Lock timeout in seconds (default: 10)
  throwOnError?: boolean; // Whether to throw errors or return stale data
  logger: Logger;
}

interface CacheData<T> {
  data: T;
  lastUpdated: number;
  error?: string;
}

export class RedisSWRCache {
  private redis: Redis;
  private ttl: number;
  private staleTime: number;
  private lockTimeout: number;
  private throwOnError: boolean;
  private logger: Logger;

  constructor(config: CacheConfig) {
    this.redis = config.redis;
    this.ttl = config.ttl;
    this.staleTime = config.staleTime;
    this.lockTimeout = config.lockTimeout || 10;
    this.throwOnError = config.throwOnError ?? true;
    this.logger = config.logger;
  }

  private async getFromCache<T>(key: string): Promise<CacheData<T> | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private async setCache<T>(
    key: string,
    data: T,
    error?: string
  ): Promise<void> {
    const cacheData: CacheData<T> = {
      data,
      lastUpdated: Date.now(),
      error,
    };
    await this.redis.setex(key, this.ttl, JSON.stringify(cacheData));
  }

  private isStale(lastUpdated: number): boolean {
    return Date.now() - lastUpdated > this.staleTime * 1000;
  }

  private async acquireLock(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();
    const acquired = await this.redis.set(
      lockKey,
      lockValue,
      "EX",
      this.lockTimeout,
      "NX"
    );
    return acquired === "OK";
  }

  private async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.redis.del(lockKey);
  }

  private async revalidate<T>(
    key: string,
    dataFn: (req: Request) => Promise<T>,
    req: Request
  ): Promise<void> {
    const lockAcquired = await this.acquireLock(key);
    if (!lockAcquired) return;

    try {
      const freshData = await dataFn(req);
      await this.setCache(key, freshData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Background revalidation failed: ${errorMessage}`);
      await this.setCache(key, null as T, errorMessage);
    } finally {
      await this.releaseLock(key);
    }
  }

  middleware<T>(
    keyFn: (req: Request) => string,
    dataFn: (req: Request) => Promise<T>,
    options?: { responseTransform?: (data: T) => any }
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // `${this.namespace}:${keyFn(req)}`;
        const cacheKey = keyFn(req);
        const cachedData = await this.getFromCache<T>(cacheKey);

        // Handle cached data
        if (cachedData) {
          if (cachedData.error && this.throwOnError) {
            throw new Error(cachedData.error);
          }

          // Trigger background revalidation if stale
          if (this.isStale(cachedData.lastUpdated)) {
            this.revalidate(cacheKey, dataFn, req).catch(console.error);
          }

          const responseData = options?.responseTransform
            ? options.responseTransform(cachedData.data)
            : cachedData.data;

          return res.json(responseData);
        }

        // No cache: fetch fresh data
        const freshData = await dataFn(req);
        await this.setCache(cacheKey, freshData);

        const responseData = options?.responseTransform
          ? options.responseTransform(freshData)
          : freshData;

        return res.json(responseData);
      } catch (error) {
        if (this.throwOnError) {
          next(error);
        } else {
          res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    };
  }

  async invalidateCache(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
