import logger from "@/services/logger";
import { getLatestEntriesFromStream } from "@/utils/stream";
import { DefaultEventsMap, Socket } from "socket.io";
import { FleetRouteInterStageMovement } from "@/types";

export const fleetMovementEvents = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  logger.info(`new client connected fleet namespace`);
  socket.on("join", async (fleetNo) => {
    logger.info("Client joined " + fleetNo);
    socket.join(fleetNo);
    socket.emit("join", fleetNo);

    const lastEntry =
      await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        ({ data: { fleetNo: fln } }) => fleetNo === fln
      );

    const routeId = lastEntry[0]?.data?.routeId ?? "Uknown";
    const routeName = lastEntry[0]?.data?.routeName ?? "Uknown";
    const currentStageId = lastEntry[0]?.data?.currentStageId ?? "Uknown";
    const currentStage = lastEntry[0]?.data?.currentStage ?? "Uknown";
    const nextStageId = lastEntry[0]?.data?.nextStageId ?? "Unkown";
    const nextStage = lastEntry[0]?.data?.nextStage ?? "Unkown";
    const direction = lastEntry[0]?.data?.traversalDirection ?? "Unknown";
    socket.emit(
      "stream_movement",
      routeId,
      routeName,
      currentStageId,
      currentStage,
      nextStageId,
      nextStage,
      direction
    );
  });
};
3;
