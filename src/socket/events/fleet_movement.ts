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

    const routeName = lastEntry[0]?.data?.routeName ?? "Uknown";
    const currentStage = lastEntry[0]?.data?.currentStage ?? "Uknown";
    const nextStage = lastEntry[0]?.data?.nextStage ?? "Unkown";

    socket.emit("stream_movement", routeName, currentStage, nextStage);
  });
};
3;
