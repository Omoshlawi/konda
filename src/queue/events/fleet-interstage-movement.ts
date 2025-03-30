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
    "/fleet",
    metadata?.fleetNo ?? payload?.fleetNo,
    payload.routeId,
    payload.routeName,
    payload.currentStageId,
    payload.currentStage,
    payload.nextStageId,
    payload.nextStage,
    payload.traversalDirection
  );
  logger.debug(
    `Processed fleet inter-stage movement: fleetNo=${
      metadata?.fleetNo ?? payload?.fleetNo
    }, routeId=${payload.routeId}, currentStage=${
      payload.currentStage
    }, nextStage=${payload.nextStage}, Direction: ${payload.traversalDirection}`
  );
};
