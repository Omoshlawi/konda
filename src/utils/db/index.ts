import { APIException } from "../exceptions";
import set from "lodash/set";

export const ERROR_CODES = Object.freeze({
  NOT_FOUND: "P2025",
  UNIQUE_CONTRAINT_FAILED: "P2002",
  RELATED_RECODE_NOT_FOUND: "P2015",
  TOO_MANY_DB_CONNECTION_OPEN: "P2037",
});

export const handlePrismaErrors: (e: any) =>
  | {
      status: number;
      errors: {
        detail: string;
      };
    }
  | {
      status: number;
      errors: {
        [x: string]: {
          _errors: string[];
        };
      };
    }
  | undefined = (e: any) => {
  if (e && "code" in e && "meta" in e && "message" in e && "name" in e) {
    // console.log(
    //   "--------------------------------------->",
    //   e.code,
    //   // e.message,
    //   e.meta,
    //   e.name
    // );

    if (e.code === ERROR_CODES.NOT_FOUND) {
      if (e.meta?.cause)
        return { status: 404, errors: { detail: e.meta!.cause as string } };
      return { status: 404, errors: { detail: e.message } };
    } else if (e.code === ERROR_CODES.UNIQUE_CONTRAINT_FAILED) {
      const taget = (e.meta as any).target as string[];

      const errors = taget.reduce(
        (prev, field) => ({
          ...prev,
          [field]: { _errors: ["Must be unique"] },
        }),
        {}
      );
      return {
        status: 400,
        errors,
      };
    }
  }
};

export function parseSingleOperationCustomRepresentation(
  customRep: string
): Record<string, any> | undefined {
  const mode = customRep?.split(":")[0]?.trim() ?? "";
  if (!["include", "select"].includes(mode)) return;
  // Helper function to parse nested properties
  function parseFields(fields: string): Record<string, any> {
    const result: Record<string, any> = {};
    let currentKey = "";
    let depth = 0;
    let nested = "";

    for (let char of fields) {
      if (char === "(") {
        depth++;
        if (depth === 1) {
          continue;
        }
      } else if (char === ")") {
        depth--;
        if (depth === 0) {
          result[currentKey.trim()] = { [mode]: parseFields(nested) };
          currentKey = "";
          nested = "";
          continue;
        }
      }

      if (depth > 0) {
        nested += char;
      } else if (char === ",") {
        if (currentKey.trim()) {
          result[currentKey.trim()] = true; // Simple field
        }
        currentKey = "";
      } else {
        currentKey += char;
      }
    }

    if (currentKey.trim()) {
      result[currentKey.trim()] = true; // Last simple field
    }

    return result;
  }
  const parsedFields = parseFields(customRep);

  function processObject(obj: Record<string, any>): Record<string, any> {
    const processedObj: Record<string, any> = {};
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        processedObj[key.endsWith(":") ? key.slice(0, -1) : key] =
          processObject(obj[key]);
      } else {
        processedObj[key] = obj[key];
      }
    }
    return processedObj;
  }

  return processObject(parsedFields)[mode][mode];
}

export const paginate = (pageSize: number, page: number) =>
  (page - 1) * pageSize;

export const getSingleOperationCustomRepresentationQuery = (
  v?: string
): any => ({
  include: v?.startsWith("include:")
    ? parseSingleOperationCustomRepresentation(v ?? "")
    : undefined,
  select: v?.startsWith("select:")
    ? parseSingleOperationCustomRepresentation(v ?? "")
    : undefined,
});

/**
 * Parses a custom query string into an array of dot-notation accessor paths
 *
 * @param input - A string in the format "key:type(fields)" where type is 'select' or 'include' or any other operation
 * @returns Array of dot-notation paths
 * @throws {Error} If the input format is invalid
 *
 * @example
 * parseAccessors('user:select(name, profile:include(avatar, settings))');
 * // Returns:
 * // [
 * //   'user.select.name',
 * //   'user.select.profile.include.avatar',
 * //   'user.select.profile.include.settings'
 * // ]
 */
export function parseAccessors(input: string): string[] {
  // Helper function to split each level of the string while maintaining nesting
  const splitFields = (fieldStr: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let openBrackets = 0;

    for (let char of fieldStr) {
      if (char === "(") openBrackets++;
      if (char === ")") openBrackets--;

      if (char === "," && openBrackets === 0) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current) fields.push(current.trim());
    return fields;
  };

  // Recursive function to build accessor paths
  const buildPaths = (prefix: string, query: string): string[] => {
    const results: string[] = [];
    const match = query.match(/^\s*(\w+)\s*:\s*(\w+)\s*\((.*)\)\s*$/);

    if (match) {
      const [, key, type, fields] = match.map((str) => str.trim()); // Trim each part
      const newPrefix = `${prefix}.${key}.${type}`;
      const subFields = splitFields(fields!);

      for (let field of subFields) {
        results.push(...buildPaths(newPrefix, field));
      }
    } else {
      results.push(`${prefix}.${query.trim()}`); // Trim the final field
    }

    return results;
  };

  // Starting point: remove the initial "custom:" and process the rest
  const topLevelMatch = input.match(/^\s*(\w+)\s*:\s*(\w+)\s*\((.*)\)\s*$/);
  if (!topLevelMatch) {
    throw new APIException(400, {
      _errors: ["Invalid custom string representationinput format"],
    });
  }

  const [, topLevelKey, topLevelType, topLevelFields] = topLevelMatch.map(
    (str) => str.trim()
  );
  const topLevelPrefix = `${topLevelKey}.${topLevelType}`;
  const fields = splitFields(topLevelFields!);

  const accessors: string[] = [];
  for (let field of fields) {
    accessors.push(...buildPaths(topLevelPrefix, field));
  }

  return accessors;
}

const parseMultipleOperationCustomRepresentation = (v: string) => {
  const accessors = parseAccessors(v);
  return accessors.reduce((acc, accessor) => {
    return { ...acc, [accessor.replace("custom.", "")]: true };
  }, {});
};

function constructNestedObject(
  flatObject: Record<string, boolean>
): Record<string, any> {
  const nestedObject: Record<string, any> = {};

  for (const [path, value] of Object.entries(flatObject)) {
    set(nestedObject, path, value);
  }

  return nestedObject;
}

export const getMultipleOperationCustomRepresentationQeury = (v?: string) => ({
  ...(v?.startsWith("custom:")
    ? constructNestedObject(parseMultipleOperationCustomRepresentation(v))
    : {}),
});
