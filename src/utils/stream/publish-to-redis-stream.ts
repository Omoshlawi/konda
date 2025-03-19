/**
 * Publish a message to a Redis Stream.
 * @param streamKey - The name of the Redis Stream.
 * @param message - The message to publish (as key-value pairs).
 * @param metadata - Optional metadata to include in the message.
 * @returns The message ID assigned by Redis.
 * @throws If the message could not be published.
 */

import logger from "@/services/logger";
import redis from "@/services/redis";
import { flattenObject } from "../helpers";

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
  payload: Record<string, any>,
  metadata: Record<string, any> = {}
): Promise<string> => {
  try {
    // Combine the message and metadata into a single object
    const messageData = { payload, metadata, timestamp: Date.now() };

    // Convert the message data into an array of key-value pairs e.g {name: value } to [name, value]
    const streamEntry = flattenObject(messageData);

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
