import { TokenPayload } from "@/types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import winston, { Logger } from "winston";
import { configuration, UUID_REGEX } from "./constants";

import { Request } from "express";
import qs from "querystring";
import logger from "@/services/logger";
import redis from "@/services/redis";
import {
  defaultSWRCacheConfig,
  smartInvalidatePattern,
  swrCache,
} from "./cache";

/**
 * Retrieves cached data using SWR (Stale-While-Revalidate) caching strategy
 *
 * @template T - The type of data being cached
 *
 * @param {Request} req - The incoming request object
 * @param {() => Promise<T>} fetcher - Function that returns a promise resolving to the data to be cached
 * @param {(req: Request) => string} [getKey] - Optional function to generate a custom cache key from the request
 *
 * @returns {Promise<T>} Promise that resolves to the cached or freshly fetched data
 *
 * @example
 * ```typescript
 * const data = await getCachedResource(
 *   request,
 *   () => fetchDataFromAPI(),
 *   (req) => `custom-key-${req.params.id}`
 * );
 * ```
 */
export const getCachedResource = <T>(
  req: Request,
  fetcher: () => Promise<T>,
  getKey?: (req: Request) => string
) => {
  const prefix = `${configuration.name}:${configuration.version}`;
  const key =
    typeof getKey === "function" ? getKey(req) : generateDefaultKey(req);
  return swrCache<T>({
    fetcher,
    key: `${prefix}:${key}`,
    logger: logger,
    redis,
    ...defaultSWRCacheConfig,
  });
};

export const invalidateCachedResource = (
  req: Request,
  getKey?: (req: Request) => string
) => {
  const prefix = `${configuration.name}:${configuration.version}`;
  const key =
    typeof getKey === "function" ? getKey(req) : generateDefaultKey(req);
  return smartInvalidatePattern(redis, {
    pattern: `${prefix}:${key}*`,
    logger,
    count: 100,
    keyThreshold: 5000,
    batchSize: 500,
  });
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

export function generateUserToken(payload: {
  userId: string;
  organizationId?: string;
  roles?: string[] | string;
  // personId?: string;
}) {
  const accessPayload: TokenPayload = {
    ...payload,
    type: "access",
  };
  const refreshPayload: TokenPayload = { ...payload, type: "refresh" };
  const accessToken = jwt.sign(accessPayload, configuration.auth.auth_secrete, {
    expiresIn: configuration.auth.access_token_age as any,
  });
  const refreshToken = jwt.sign(
    refreshPayload,
    configuration.auth.auth_secrete,
    {
      expiresIn: configuration.auth.refresh_token_age as any,
    }
  );
  return { accessToken, refreshToken };
}

export const checkPassword = async (hash: string, password: string) => {
  return await bcrypt.compare(password, hash);
};

export const createLogger: () => Logger = () => {
  const logger: Logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: `${configuration.name}:${configuration.version}` },
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
      new winston.transports.File({ filename: "error.log", level: "error" }),
      // new winston.transports.File({ filename: "warning.log", level: "warn" }),
      // new winston.transports.File({ filename: "combined.log" }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }
  return logger as Logger;
};

export function parseMessage(object: any, template: string) {
  // regular expression to match placeholders like {{field}}
  const placeholderRegex = /{{(.*?)}}/g;

  // Use a replace function to replace placeholders with corresponding values
  const parsedMessage = template.replace(
    placeholderRegex,
    (match, fieldName) => {
      // The fieldName variable contains the field name inside the placeholder
      // Check if the field exists in the event object
      if (object.hasOwnProperty(fieldName)) {
        return object[fieldName]; // Replace with the field's value
      } else {
        // Placeholder not found in event, leave it unchanged
        return match;
      }
    }
  );

  return parsedMessage;
}

export function isValidURL(url: string): boolean {
  try {
    // Attempt to create a URL object
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function normalizePhoneNumber(phoneNumber: string) {
  // Define the regex pattern to capture the phone number part
  const kenyanPhoneNumberRegex = /^(\+?254|0)?((7|1)\d{8})$/;

  // Match the phone number against the regex
  const match = phoneNumber.match(kenyanPhoneNumberRegex);

  // If there's a match, return the captured group; otherwise, return null or throw an error
  if (match) {
    return match[2]; // The second capturing group contains the desired phone number part
  } else {
    throw new Error("Invalid Kenyan phone number format");
  }
}

export const normalizeIp = (ip: string) => {
  // Normalize IPv6 localhost address
  if (ip === "::1") {
    return "127.0.0.1";
  }
  // Strip IPv6 prefix for IPv4 addresses
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip;
};

export const isUUID = (value: string) => {
  return UUID_REGEX.test(value);
};

export const nullifyExceptionAsync = <T, P extends any[], TErr = Error>(
  fn: (...args: P) => Promise<T>,
  onError?: (error: TErr) => void
): ((...args: P) => Promise<T | null>) => {
  return async (...args: P) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      onError?.(error);
      return null;
    }
  };
};

export const toQueryParams = (q: Record<string, any>) => {
  const params = qs.stringify(q);
  if (params) {
    return "?" + params;
  }
  return "";
};

export const normalizeQuery = (query: Record<string, any>) => {
  const sortedQuery = Object.keys(query)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: query[key] }), {});
  return toQueryParams(sortedQuery);
};

export const generateDefaultKey = (req: Request) => {
  const basePath = req.originalUrl?.split("?")?.at(0) ?? "";
  const normalizedQuery = normalizeQuery(req.query);
  return `${basePath}${normalizedQuery}`;
};

type NestedObject = { [key: string]: any };
type FlattenedArray = (string | any)[];

export function flattenObject(
  obj: NestedObject,
  parentKey: string = ""
): FlattenedArray {
  const result: FlattenedArray = [];

  Object.entries(obj).forEach(([key, value]) => {
    const accessor = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result.push(...flattenObject(value, accessor));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayAccessor = `${accessor}.${index}`;
        if (typeof item === "object" && item !== null) {
          result.push(...flattenObject(item, arrayAccessor));
        } else {
          result.push(arrayAccessor, item);
        }
      });
    } else {
      result.push(accessor, value);
    }
  });

  return result;
}

type UnflattenedObject = { [key: string]: any };

export function unflattenArray(arr: FlattenedArray): UnflattenedObject {
  const result: UnflattenedObject = {};

  for (let i = 0; i < arr.length; i += 2) {
    const accessor = arr[i] as string;
    const value = arr[i + 1];

    const keys = accessor.split(".");
    let current = result;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value; // Assign the value at the deepest level
      } else {
        current[key] =
          current[key] || (isNaN(parseInt(keys[index + 1] || "")) ? {} : []); // Create an object or array
        current = current[key];
      }
    });
  }

  return result;
}
