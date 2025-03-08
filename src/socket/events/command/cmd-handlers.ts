import { MQTT_TOPICS } from "@/queue";
import logger from "@/services/logger";
import mqttClient from "@/services/mqtt";
import { DefaultEventsMap, Socket } from "socket.io";

export const onCommand = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  cmd: any
) => {
  // command input from end user
  logger.info("Command received from Received: ", cmd);
  mqttClient.publish(MQTT_TOPICS.CMD_BROADCAST, cmd, { qos: 2 });
};
