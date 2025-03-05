import logger from "@/services/logger";
import mqttClient from "@/services/mqtt";

const MQTT_TOPICS = {
  GPS: "sensors/gps",
  TEMPERATURE: "sensors/tmp",
} as const;

export const subscribeToMQTTTopics = () => {
  // Subscribe to all topics
  Object.values(MQTT_TOPICS).forEach((topic) => {
    mqttClient.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`[MQTT:subscribe]: Failed to subscribe to ${topic}:`, err);
        return;
      }
      logger.info(`[MQTT:subscribe]: Successfully subscribed to ${topic}`);
    });
  });

  // Single message handler for all topics
  mqttClient.on("message", async (topic, payload) => {
    logger.info(`[MQTT:message]: ${topic}`);
    const data = payload.toString();

    switch (topic) {
      case MQTT_TOPICS.GPS:
        logger.info(`GPS data received: ${data}`);
        break;
      case MQTT_TOPICS.TEMPERATURE:
        logger.info(`Temperature data received: ${data}`);
        break;
      default:
        logger.warn(`Unhandled topic: ${topic}`);
    }
  });
};
