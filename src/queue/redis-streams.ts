import { sendSocketMessage } from "@/socket";
import {
  createRedisStreamConsumer,
  getLatestEntriesFromStream,
  MessageHandler,
  RedisStreamConsumerOptions,
} from "@/utils/stream";
import { MQTT_TOPICS } from ".";
import {
  FleetRouteInterStageMovement,
  GPSSesorData,
} from "@/socket/events/types";
import logger from "@/services/logger";

const fleetStream = async () => {
  const fleetStreamOptions: RedisStreamConsumerOptions = {
    streamKey: "fleet_movement_stream",
    groupName: "fleet_tracking_group",
  };

  const fleetStreamHandler: MessageHandler<
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

  await createRedisStreamConsumer(fleetStreamOptions, fleetStreamHandler);
};

const mqttStream = async () => {
  const gpsStreamOptions: RedisStreamConsumerOptions = {
    streamKey: MQTT_TOPICS.GPS.replace("/", "_"),
    groupName: "gps_consumer_group",
  };

  const gpsStreamHandler: MessageHandler<
    { data: string },
    { topic: string; timeStamp: string }
  > = async (streamKey, messageId, { data }, metadata) => {
    const payload: GPSSesorData = JSON.parse(data);
    // 1 Get last known values
    const lastEntry =
      await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        ({ data: { fleetNo: fln } }) => payload.fleetNo === fln
      );

    if (lastEntry.length === 0) {
      logger.info(`No movement history for fleet: ${payload.fleetNo}`);
    }
    // TODO Stream changes to users subscribed to realtime cordinate changes for current fleet

    
    // Check if curr location is in boundary of next stage and if so update currStage to the next and next stage query from db abd store to next
    // rEMEMBER TO NORTIFIER MICROCONTROLLER AND End user subscribed
  };
  await createRedisStreamConsumer(gpsStreamOptions, gpsStreamHandler);
};

export const subscribeToRedisStreams = () => {
  fleetStream();
  mqttStream();
};
