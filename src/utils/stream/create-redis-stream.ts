import logger from "@/services/logger";
import redis from "@/services/redis";
import { v4 as uuidv4 } from "uuid";
import { unflattenArray } from "../helpers";

// Define the expected structure of the Redis Stream messages
export type RedisStreamMessage = [string, string[]]; // [messageId, [key1,value1, key2,value2, ...keyn, ...valuen]]
export type RedisStreamMessages = [string, RedisStreamMessage[]][] | null; // An array of stream names and their respective messages, or null if no messages

/**
 * Configuration options for the Redis Stream consumer.
 */
export interface RedisStreamConsumerOptions {
  streamKey: string; // The Redis Stream key
  groupName: string; // The consumer group name
  consumerName?: string; // Optional: The consumer name (defaults to a UUID)
  batchSize?: number; // Optional: Number of messages to process at once (default: 10)
  blockTime?: number; // Optional: Time to block while waiting for new messages (default: 5000ms)
}

/**
 * Processes a message from a Redis Stream.
 *
 * @param streamKey - The Redis Stream key.
 * @param messageId - The ID of the message.
 * @param data - The message data as key-value pairs.
 */
export type MessageHandler = (
  streamKey: string,
  messageId: string,
  payload: Record<string, any>,
  metadata?: Record<string, any>
) => Promise<void>;

/**
 * Subscribes to a Redis stream and processes incoming messages in a consumer group.
 *
 * This function sets up a Redis consumer group for a specified stream and continuously
 * listens for new messages. It processes messages in batches, acknowledges them after
 * processing, and handles graceful shutdown on termination signals.
 *
 * @async
 * @function
 *
 * @param options - Configuration options for the Redis Stream consumer.
 * @param messageHandler - A function to handle each message.
 *
 * @throws Will throw an error if the consumer group cannot be created and the error
 *         is not related to the group already existing.
 *
 * @remarks
 * - The consumer group is created if it does not already exist.
 * - Messages are read in batches and blocked for a specified time if no new messages are available.
 * - Each message is acknowledged after processing to prevent reprocessing.
 * - Graceful shutdown is handled by listening to `SIGINT` and `SIGTERM` signals.
 *
 * @example
 * ```typescript
 * import { createRedisStreamConsumer } from './redis-streams';
 *
 * const options = {
 *   streamKey: "device-stream",
 *   groupName: "device-group",
 *   batchSize: 10,
 *   blockTime: 5000,
 * };
 *
 * const messageHandler = async (streamKey, messageId, data) => {
 *   console.log(`Processing message ${messageId} from ${streamKey}:`, data);
 * };
 *
 * createRedisStreamConsumer(options, messageHandler).catch(err => {
 *   console.error('Error subscribing to Redis streams:', err);
 * });
 * ```
 */
export const createRedisStreamConsumer = async (
  options: RedisStreamConsumerOptions,
  messageHandler: MessageHandler
) => {
  const {
    streamKey,
    groupName,
    consumerName = `consumer-${uuidv4()}`,
    batchSize = 10,
    blockTime = 5000,
  } = options;

  // Ensure the consumer group exists
  try {
    await redis.xgroup("CREATE", streamKey, groupName, "$", "MKSTREAM");
    logger.info(`Consumer group "${groupName}" created or already exists.`);
  } catch (err: any) {
    if (!err.message.includes("BUSYGROUP")) {
      logger.error(`Error creating consumer group: ${JSON.stringify(err)}`);
      throw err; // Rethrow if it's not a "group already exists" error
    }
  }

  /**
   * Processes pending messages (messages that were delivered but not acknowledged).
   */
  const processPendingMessages = async () => {
    try {
      // Fetch pending messages for this consumer group
      const pendingMessages = (await redis.xpending(
        streamKey,
        groupName,
        "-",
        "+",
        batchSize,
        consumerName
      )) as [string, string, number, number][]; // [messageId, consumer, idleTime, deliveryCount]

      if (pendingMessages.length > 0) {
        logger.info(`Processing ${pendingMessages.length} pending messages...`);

        for (const [messageId] of pendingMessages) {
          // Claim the message for this consumer
          const claimedMessages = (await redis.xclaim(
            streamKey,
            groupName,
            consumerName,
            60000,
            messageId
          )) as RedisStreamMessages;

          if (claimedMessages) {
            for (const [, streamMessages] of claimedMessages) {
              for (const [id, fields] of streamMessages) {
                // Convert fields array to an object
                const data = unflattenArray(fields);
                await messageHandler(
                  streamKey,
                  id,
                  data.payload,
                  data?.metadata
                );

                // Acknowledge the message
                await redis.xack(streamKey, groupName, id);
                logger.info(`Acknowledged pending message ${id}`);
              }
            }
          }
        }
      }
    } catch (err) {
      logger.error(`Error processing pending messages: ${JSON.stringify(err)}`);
    }
  };

  /**
   * Processes new messages from the Redis Stream.
   */
  const processNewMessages = async () => {
    try {
      // Read messages from the stream
      const messages = (await redis.xreadgroup(
        "GROUP",
        groupName,
        consumerName,
        "COUNT",
        batchSize, // Process up to `batchSize` messages at a time
        "BLOCK",
        blockTime, // Block for `blockTime` milliseconds
        "STREAMS",
        streamKey,
        ">" // Read new messages
      )) as RedisStreamMessages;

      if (messages) {
        for (const [, streamMessages] of messages) {
          for (const [id, fields] of streamMessages) {
            // Convert fields array to an object
            const data = unflattenArray(fields);
            await messageHandler(streamKey, id, data.payload, data?.metadata);

            // Acknowledge the message
            await redis.xack(streamKey, groupName, id);
            logger.info(`Acknowledged message ${id}`);
          }
        }
      }
    } catch (err) {
      logger.error(`Error processing new messages: ${JSON.stringify(err)}`);
    }
  };

  /**
   * Continuously processes messages from the Redis Stream.
   */
  const processStream = async () => {
    // Process pending messages first
    await processPendingMessages();

    // Process new messages
    await processNewMessages();
  };

  // Continuously process the stream
  let isRunning = true;
  const stopProcessing = () => {
    isRunning = false;
    logger.info("Stopping stream processing...");
  };

  // Handle graceful shutdown
  process.on("SIGINT", stopProcessing);
  process.on("SIGTERM", stopProcessing);

  while (isRunning) {
    await processStream();
  }

  // Close the Redis client on shutdown
  await redis.quit();
  logger.info("Stream processing stopped.");
};
