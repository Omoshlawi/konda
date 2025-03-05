import { createRedisClient, Redis } from "@/utils/cache";
import logger from "./logger";
import { configuration } from "@/utils/constants";

const globalForRedis = global as unknown as { redis: Redis };

const redis =
  globalForRedis.redis ||
  createRedisClient(
    configuration.redis!,
    () => {
      logger.info(
        `Connection to Redis server ${configuration.redis!} succesfull`
      );
    },
    (err) => logger.error(`Error connecting to redis service:  ${err}`)
  );

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
