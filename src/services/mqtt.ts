import { configuration } from "@/utils/constants";
import mqtt, { MqttClient } from "mqtt";
import logger from "./logger";

const createMQTTClient = () => {
  const client = mqtt.connect(configuration.mqtt, {
    clean: false,
    clientId: `${configuration.name}:${configuration.version}`,
    queueQoSZero: true,
    reconnectPeriod: 1000,
  });
  client.on("connect", (pkt) => {
    logger.info(
      `[MQTT:connect] Connection established successfully with MQTT Broker at ${
        configuration.mqtt
      }.${JSON.stringify(pkt)}`
    );
  });
  client.on("error", (err) => {
    logger.error(
      `[MQTT:error]: Error initializing mqtt client: ${err?.message}`
    );
  });

  return client;
};

const globalForMQTTClient = global as unknown as { mqttClient: MqttClient };

export const mqttClient = globalForMQTTClient.mqttClient || createMQTTClient();
if (process.env.NODE_ENV !== "production")
  globalForMQTTClient.mqttClient = mqttClient;

export default mqttClient;
