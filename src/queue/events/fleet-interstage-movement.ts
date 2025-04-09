import logger from "@/services/logger";
import { sendSocketMessage } from "@/socket";
import { FleetRouteInterStageMovement } from "@/types";
import { MessageHandler } from "@/utils/stream";

export const fleetInterStageMovementStreamHandler: MessageHandler<
  FleetRouteInterStageMovement,
  { fleetNo: string }
> = async (streamKey, messageId, payload, metadata) => {
  sendSocketMessage(
    "stream_movement",
    "/fleet-movement",
    payload.fleetNo,
    JSON.stringify(payload)
  );

  // Send push notification reminders to clients who requested it

  logger.debug(
    `Processed fleet inter-stage movement: fleetNo=${payload?.fleetNo}, routeId=${payload.routeId}, currentStage=${payload.currentStage}, nextStage=${payload.nextStage}, Direction: ${payload.traversalDirection}`
  );
};
