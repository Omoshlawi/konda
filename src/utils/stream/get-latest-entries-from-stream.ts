import logger from "@/services/logger";
import redis from "@/services/redis";
import { unflattenArray } from "../helpers";
/**
 * Represents a Redis Stream entry.
 */
type RedisStreamEntry<T = Record<string, any>> = {
  id: string; // The entry ID
  data: T; // The entry data
};

/**
 * Represents metadata associated with a Redis Stream entry.
 */
type RedisStreamMetadata = Record<string, any>;

/**
 * Represents the options for fetching entries from a Redis Stream.
 */
type RedisStreamOptions = {
  scanWindow?: number; // The number of entries to scan from the stream (default: 100)
  startDate?: Date; // Optional start date for filtering entries (inclusive)
  endDate?: Date; // Optional end date for filtering entries (inclusive)
};

/**
 * A predicate function to filter Redis Stream entries.
 *
 * @param entry - The Redis Stream entry to evaluate.
 * @param metadata - Optional metadata associated with the entry.
 * @returns `true` if the entry matches the predicate, otherwise `false`.
 */
type RedisStreamPredicate<T = Record<string, any>> = (
  entry: RedisStreamEntry<T>,
  metadata?: RedisStreamMetadata
) => boolean;

/**
 * Retrieves the latest entries from a Redis Stream that match a given predicate.
 *
 * @param streamName - The name of the Redis Stream.
 * @param predicate - A function to filter entries. Returns `true` for matching entries.
 * @param count - The maximum number of entries to return (default: 1).
 * @param options - Options for fetching entries, including scan window and date range.
 * @returns An array of matching entries, or an empty array if no matches are found.
 *
 * @example
 * ```typescript
 * const streamName = "device-stream";
 * const predicate = (entry) => entry.data.fleetNumber === "SM002";
 * const options = { scanWindow: 100, startDate: new Date("2023-10-01"), endDate: new Date("2023-10-31") };
 *
 * const entries = await getLatestEntriesFromStream(streamName, predicate, 1, options);
 * console.log(entries);
 * ```
 */
export async function getLatestEntriesFromStream<T = Record<string, any>>(
  streamName: string,
  predicate: RedisStreamPredicate<T>,
  count: number = 1,
  options: RedisStreamOptions = {}
): Promise<RedisStreamEntry<T>[]> {
  const { scanWindow = 100, startDate, endDate } = options;
  // Convert dates to Redis Stream IDs
  const startId = startDate ? `${startDate.getTime()}-0` : "-";
  const endId = endDate ? `${endDate.getTime()}-0` : "+";
  try {
    if (count <= 0) return [];

    // Fetch entries from the stream within the specified range
    const result = await redis.xrevrange(
      streamName,
      endId, // End of the range (most recent)
      startId, // Start of the range (oldest)
      "COUNT",
      scanWindow
    );

    const matchedEntries: RedisStreamEntry<T>[] = [];

    for (const [entryId, fields] of result) {
      // Convert fields array to an object
      const data = unflattenArray(fields);
      const entry = { id: entryId, data: data.payload as T };

      // Check if the entry matches the predicate
      if (predicate(entry, data?.metadata)) {
        matchedEntries.push(entry);
        if (matchedEntries.length >= count) {
          break; // Stop once we reach the required number of entries
        }
      }
    }

    return matchedEntries;
  } catch (error: any) {
    logger.error(
      `Error fetching latest entries from ${streamName} (count=${count}, scanWindow=${scanWindow}, startId: ${startId}, endId: ${endId}): ${error?.message}`
    );
    return [];
  }
}
