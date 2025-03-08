import logger from "@/services/logger";
import mqttClient from "@/services/mqtt";
import EventEmitter from "events";
import { onCommand, onSesorGps, onSesorTemprature } from "./events";

export const MQTT_TOPICS = Object.freeze({
  GPS: "sensors/gps",
  TEMPERATURE: "sensors/tmp",
  CMD_BROADCAST: "sensor/cmd/broadcast",
});

export const subscribeToMQTTTopicsAndEvents = () => {
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

  // Handle client disconnects
  mqttClient.on("close", () => {
    logger.warn("[MQTT:close]: Connection closed. Reconnecting...");
    mqttClient.reconnect();
  });

  const mqttEventsEmitter = new EventEmitter();
  // Listen to messages and emit them as topic based events
  mqttClient.on("message", (topic, payload, packet) => {
    logger.info(`[MQTT:message]: ${topic}`);
    mqttEventsEmitter.emit(topic, payload, packet);
  });

  // Subscribe to mqtt emmite events
  mqttEventsEmitter.on(MQTT_TOPICS.CMD_BROADCAST, onCommand);
  mqttEventsEmitter.on(MQTT_TOPICS.TEMPERATURE, onSesorTemprature);
  mqttEventsEmitter.on(MQTT_TOPICS.GPS, onSesorGps);
};

export const unsubscribeFromMQTTTopics = () => {
  Object.values(MQTT_TOPICS).forEach((topic) => {
    mqttClient.unsubscribe(topic, (err: any) => {
      if (err) {
        logger.error(
          `[MQTT:unsubscribe]: Failed to unsubscribe from ${topic}:`,
          err
        );
        return;
      }
      logger.info(
        `[MQTT:unsubscribe]: Successfully unsubscribed from ${topic}`
      );
    });
  });
};

// Graceful shutdown
process.on("SIGINT", () => {
  mqttClient.on("close", () => {
    logger.info("[MQTT:shutdown]: MQTT client disconnected gracefully.");
    process.exit(0);
  });
  mqttClient.end();
});
