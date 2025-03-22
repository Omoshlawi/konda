import logger from "@/services/logger";
import mqttClient from "@/services/mqtt";
import { publishToRedisStream } from "@/utils/stream";

export const MQTT_TOPICS = Object.freeze({
  GPS: "sensors/gps",
  TEMPERATURE: "sensors/tmp",
  CMD_BROADCAST: "sensor/cmd/broadcast",
});

export const subscribeToMQTTTopicsAndEvents = () => {
  // TODO: remove
  setInterval(() => {
    mqttClient.publish(
      "sensors/gps",
      JSON.stringify({
        latitude: -1.12536,
        longitude: 25.852,
        fleetNo: "SM-002",
      })
    );
  }, 2000);

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

  // Listen to messages and emit them as topic based events
  mqttClient.on("message", (topic, payload, packet) => {
    logger.info(`[MQTT:message]: ${topic}`);
    let _payload;
    let contentType: "text" | "binary" = "text";
    try {
      _payload = JSON.parse(payload.toString("utf-8")); // Try JSON first
    } catch (error) {
      logger.warn(
        `Non-JSON payload detected on topic ${topic}, encoding as Base64.`
      );
      _payload = payload.toString("base64"); // Encode binary as Base64
      contentType = "binary";
    }

    publishToRedisStream(
      topic.replace("/", "_"),
      contentType === "binary" ? { data: _payload } : _payload,
      { topic, contentType, timestamp: Date.now() }
    );
  });
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
