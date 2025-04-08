import { FleetCommandDataSchema } from "@/schema";
import logger from "@/services/logger";
import { FleetCommand } from "@/types";
import { MessageHandler } from "@/utils/stream";
import { startTrip } from "../controllers/start-trip";
import { endTrip } from "../controllers/end-trip";

export const fleetCommandStreamHandler: MessageHandler<
  FleetCommand,
  { fleetNo: string }
> = async (streamKey, messageId, payload, metadata) => {
  const validation = await FleetCommandDataSchema.safeParseAsync(payload);
  if (!validation.success) {
    logger.warn(
      `Invalid fleet command: ${JSON.stringify(
        payload
      )}.Error: ${JSON.stringify(validation.error.format())}`
    );
    // TODO Send notification
    return;
  }

  logger.debug(
    `Processing command for fleet: ${payload?.fleetNo}: ${JSON.stringify(
      payload
    )}`
  );

  const cmd = payload.command;
  switch (cmd) {
    case "start-trip":
      await startTrip(payload.fleetNo, payload.args);
      break;
    case "end-trip":
      await endTrip(payload.fleetNo);
      break;
    default:
      logger.error(`Unhandled fleet command: ${cmd}`);
      break;
  }
};
