import logger from "@/services/logger";
import { DefaultEventsMap, Socket } from "socket.io";

export const fleetMovementEvents = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  logger.info(`new client connected fleet namespace`);
  socket.on("join", async (fleetNo) => {
    logger.info("Client joined " + fleetNo);
    socket.join(fleetNo);
    socket.emit("join", fleetNo);

    socket.on("stream_movement", async () => {
      logger.info(`Streaming movement for fleet ${fleetNo}`);
      socket
        .to(fleetNo)
        .emit(
          "stream_movement",
          { name: "CBD-JUJA" },
          { name: "Ruiru" },
          { name: "Juja" }
        );

      socket.emit(
        "stream_movement",
        { name: "CBD-JUJA" },
        { name: "Ruiru" },
        { name: "Juja" }
      );
    });
  });
};
