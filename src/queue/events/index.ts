import logger from "@/services/logger";
import { sendSocketMessage } from "@/socket";
import { Packet } from "mqtt";

export const onCommand = (payload: Buffer<ArrayBufferLike>, packet: Packet) => {
  logger.info(
    `[MQTT:oncommand]Received command from device: ${payload.toString()} `
  );

  sendSocketMessage("cmd", "/cmd", undefined, payload.toString());
};

export const onSesorTemprature = (
  payload: Buffer<ArrayBufferLike>,
  packet: Packet
) => {};

export const onSesorGps = (
  payload: Buffer<ArrayBufferLike>,
  packet: Packet
) => {};

export * from "./gps-sensor";
