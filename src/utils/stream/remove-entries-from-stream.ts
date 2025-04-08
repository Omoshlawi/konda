import logger from "@/services/logger";
import redis from "@/services/redis";

/**
 * Removes specified entries from a Redis Stream.
 *
 * @param streamName - The name of the Redis Stream.
 * @param entryIds - An array of entry IDs to remove from the stream.
 * @returns The number of entries successfully deleted.
 *
 * @example
 * ```typescript
 * const streamName = "device-stream";
 * const entriesToRemove = ["1712543200000-0", "1712543210000-0"];
 *
 * const removedCount = await removeEntriesFromStream(streamName, entriesToRemove);
 * console.log(`Removed ${removedCount} entries.`);
 * ```
 */
export async function removeEntriesFromStream(
  streamName: string,
  entryIds: string[]
): Promise<number> {
  if (!entryIds.length) return 0;

  try {
    const deletedCount = await redis.xdel(streamName, ...entryIds);
    logger.info(`Deleted ${deletedCount} entries from stream ${streamName}`);
    return deletedCount;
  } catch (error: any) {
    logger.error(
      `Error deleting entries from ${streamName}: ${error?.message}`
    );
    return 0;
  }
}
