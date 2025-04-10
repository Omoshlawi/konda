import {
  createRedisStreamConsumer,
  RedisStreamConsumerOptions,
} from "@/utils/stream";
import { MQTT_TOPICS } from ".";
import { gpsStreamHandler } from "./events/gps-sensor";
import { fleetInterStageMovementStreamHandler } from "./events/fleet-interstage-movement";
import { fleetCommandStreamHandler } from "./events/fleet-command";

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

const mqttGPSStream = async () => {
  const gpsStreamOptions: RedisStreamConsumerOptions = {
    streamKey: MQTT_TOPICS.GPS.replace("/", "_"),
    groupName: "gps_consumer_group",
  };

  await createRedisStreamConsumer(gpsStreamOptions, gpsStreamHandler);
};

const mqttFleetCommandStream = async () => {
  const gpsStreamOptions: RedisStreamConsumerOptions = {
    streamKey: MQTT_TOPICS.FLEET_COMMANDS.replace("/", "_"),
    groupName: "fleet_command_consumer_group",
  };

  await createRedisStreamConsumer(gpsStreamOptions, fleetCommandStreamHandler);
};

export const subscribeToRedisStreams = () => {
  fleetStream();
  mqttGPSStream();
  mqttFleetCommandStream();
};
