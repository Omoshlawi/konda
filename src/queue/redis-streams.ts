import { sendSocketMessage } from "@/socket";
import {
  createRedisStreamConsumer,
  MessageHandler,
  RedisStreamConsumerOptions,
} from "@/utils/stream";
import { MQTT_TOPICS } from ".";
import { FleetRouteInterStageMovement } from "@/socket/events/types";

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
    const payload: { latitude: number; longitude: number; fleet: string } =
      JSON.parse(data);
    console.log("GPS", payload);

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
