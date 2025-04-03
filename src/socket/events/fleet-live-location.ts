import { MQTT_TOPICS } from "@/queue";
import logger from "@/services/logger";
import { GPSSesorData } from "@/types";
import { getLatestEntriesFromStream } from "@/utils/stream";
import { DefaultEventsMap, Socket } from "socket.io";

export const fleetLiveLocation = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  logger.info(`new client connected fleet live location namespace`);
  socket.on("join", async (fleetNo) => {
    logger.info("Client joined " + fleetNo);
    socket.join(fleetNo);
    socket.emit("join", fleetNo);

    const lastEntry = await getLatestEntriesFromStream<GPSSesorData>(
      MQTT_TOPICS.GPS.replace("/", "_"),
      ({ data: { fleetNo: fln } }) => fleetNo === fln
    );

    const gpsData = JSON.stringify(
      lastEntry[0]?.data ?? { fleetNo, latitude: 0, longitude: 0 }
    );

    socket.emit("stream_live_location", gpsData);
  });
};
3;
