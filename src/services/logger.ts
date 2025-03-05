import { createLogger } from "@/utils/helpers";
import { Logger } from "winston";

const globalForLogger = global as unknown as { logger: Logger };

export const logger = globalForLogger.logger || createLogger();
if (process.env.NODE_ENV !== "production") globalForLogger.logger = logger;

export default logger;
