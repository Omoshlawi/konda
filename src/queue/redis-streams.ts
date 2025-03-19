import logger from "@/services/logger";
import redis from "@/services/redis";
import { v4 as uuidv4 } from "uuid";

// Define the expected structure of the messages
type RedisStreamMessage = [string, [string, string[]][]]; // [streamKey, [messageId, fields][]]
type RedisStreamMessages = [string, RedisStreamMessage[]][] | null; // Array of streams

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
 * @throws Will throw an error if the consumer group cannot be created and the error
 *         is not related to the group already existing.
 *
 * @remarks
 * - The consumer group is created if it does not already exist.
 * - Messages are read in batches of up to 10 and blocked for up to 5 seconds if no
 *   new messages are available.
 * - Each message is acknowledged after processing to prevent reprocessing.
 * - Graceful shutdown is handled by listening to `SIGINT` and `SIGTERM` signals.
 *
 * @example
 * ```typescript
 * import { subscribeToRedisStreams } from './redis-streams';
 *
 * subscribeToRedisStreams().catch(err => {
 *   console.error('Error subscribing to Redis streams:', err);
 * });
 * ```
 */
export const subscribeToRedisStreams = async () => {
  const streamKey = "device-stream";
  const groupName = "device-group";
  const consumerName = `consumer-${uuidv4()}`;

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
        10,
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
                const data = Object.fromEntries(fields);
                logger.info(
                  `Processing pending message ${id}: ${JSON.stringify(data)}`
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
        10, // Process up to 10 messages at a time
        "BLOCK",
        5000, // Block for 5 seconds
        "STREAMS",
        streamKey,
        ">" // Read new messages
      )) as RedisStreamMessages;

      if (messages) {
        for (const [, streamMessages] of messages) {
          for (const [id, fields] of streamMessages) {
            // Convert fields array to an object
            const data = Object.fromEntries(fields);
            logger.info(
              `Received data from stream ${streamKey}: ${JSON.stringify(data)}`
            );
            // TODO Add message handler callback or events emitter to handle message proceesing
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

/**
 * Publish a message to a Redis Stream.
 * @param streamKey - The name of the Redis Stream.
 * @param message - The message to publish (as key-value pairs).
 * @param metadata - Optional metadata to include in the message.
 * @returns The message ID assigned by Redis.
 * @throws If the message could not be published.
 */
/**
 * Publishes a message to a Redis Stream.
 *
 * @param streamKey - The key of the Redis Stream to which the message will be published.
 * @param message - An object containing the message data as key-value pairs.
 *                  The values can be strings or numbers.
 * @param metadata - Optional metadata to include with the message as key-value pairs.
 *                   The values can be strings or numbers. Defaults to an empty object.
 * @returns A promise that resolves to the ID of the published message in the Redis Stream.
 * @throws Will throw an error if the message fails to be published to the Redis Stream.
 *
 * @example
 * ```typescript
 * const streamKey = "example-stream";
 * const message = { userId: 123, action: "login" };
 * const metadata = { source: "web-app" };
 *
 * try {
 *   const messageId = await publishToRedisStream(streamKey, message, metadata);
 *   console.log(`Message published with ID: ${messageId}`);
 * } catch (error) {
 *   console.error("Failed to publish message:", error);
 * }
 * ```
 */
export const publishToRedisStream = async (
  streamKey: string,
  message: Record<string, string | number>,
  metadata: Record<string, string | number> = {}
): Promise<string> => {
  try {
    // Combine the message and metadata into a single object
    const messageData = { ...message, ...metadata, timestamp: Date.now() };

    // Convert the message data into an array of key-value pairs e.g {name: value } to [name, value]
    const streamEntry = Object.entries(messageData).flat();

    // Publish the message to the Redis Stream
    const messageId = await redis.xadd(streamKey, "*", ...streamEntry);

    // Check if the message ID is null
    if (messageId === null) {
      throw new Error(`Failed to publish message to stream "${streamKey}".`);
    }

    logger.info(
      `Published message to stream "${streamKey}" with ID: ${messageId}`
    );
    return messageId;
  } catch (err) {
    logger.error(
      `Error publishing message to stream "${streamKey}":${JSON.stringify(err)}`
    );
    throw err; // Rethrow the error for the caller to handle
  }
};
