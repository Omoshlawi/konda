import logger from "@/services/logger";
import { getLatestEntriesFromStream } from "@/utils/stream";
import { DefaultEventsMap, Socket } from "socket.io";
import { FleetRouteInterStageMovement } from "@/types";

export const fleetMovementEvents = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  logger.info(`new client connected fleet movement namespace`);
  socket.on("join", async (fleetNo) => {
    logger.info("Client joined " + fleetNo);
    socket.join(fleetNo);
    socket.emit("join", fleetNo);

    // Get last known movement info ad forward to client
    const lastEntry =
      await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        ({ data: { fleetNo: fln } }) => fleetNo === fln
      );

    socket.emit("stream_movement", JSON.stringify(lastEntry[0]?.data));
  });
};
3;
