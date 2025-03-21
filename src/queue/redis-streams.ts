import { sendSocketMessage } from "@/socket";
import { FleetRouteInterStageMovement } from "@/socket/events/types";
import {
  createRedisStreamConsumer,
  MessageHandler,
  RedisStreamConsumerOptions,
} from "@/utils/stream";
import { MQTT_TOPICS } from ".";
import { gpsStreamHandler } from "./events";
import { fleetInterStageMovementStreamHandler } from "./events/fleet-interstage-movement";

const fleetStream = async () => {
  const fleetStreamOptions: RedisStreamConsumerOptions = {
    streamKey: "fleet_movement_stream",
    groupName: "fleet_tracking_group",
  };
  await createRedisStreamConsumer(
    fleetStreamOptions,
    fleetInterStageMovementStreamHandler
  );
};

const mqttStream = async () => {
  const gpsStreamOptions: RedisStreamConsumerOptions = {
    streamKey: MQTT_TOPICS.GPS.replace("/", "_"),
    groupName: "gps_consumer_group",
  };

  await createRedisStreamConsumer(gpsStreamOptions, gpsStreamHandler);
};

export const subscribeToRedisStreams = () => {
  fleetStream();
  mqttStream();
};
