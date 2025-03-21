import { sendSocketMessage } from "@/socket";
import { FleetRouteInterStageMovement } from "@/socket/events/types";
import { MessageHandler } from "@/utils/stream";

export const fleetInterStageMovementStreamHandler: MessageHandler<
    FleetRouteInterStageMovement,
    { fleetNo: string }
  > = async (streamKey, messageId, payload, metadata) => {
    sendSocketMessage(
      "stream_movement",
      "/fleet",
      metadata?.fleetNo ?? payload?.fleetNo,
      payload.routeName,
      payload.currentStage,
      payload.nextStage
    );
    console.log(
      `Processing message ${messageId} from ${streamKey}:`,
      JSON.stringify(payload, null, 2)
    );
    console.log("Metadat: ", metadata);
  };