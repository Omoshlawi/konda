import socketIO from "@/services/socket-io";
import { commandEvents } from "./events";
import chatsEvents from "./events/chats";
import logger from "@/services/logger";
import { fleetMovementEvents } from "./events/fleet_movement";

export const setUpSocketNamespacesAndSubscribeToEvents = () => {
  // Namespace management
  const chatNamespace = socketIO.of("/ws/chat");
  const commandsNamespace = socketIO.of("/ws/cmd");
  const fleetMovementNamespace = socketIO.of("/ws/fleet");

  // Register events for different namespaces
  commandsNamespace.on("connection", commandEvents);
  chatNamespace.on("connection", chatsEvents);
  fleetMovementNamespace.on("connection", fleetMovementEvents);
  logger.info("Loaded namespaces and events, waiting client connections");
};

export const sendSocketMessage = (
  event: string,
  namespace?: string,
  room?: string,
  ...args: any[]
) => {
  if (namespace) {
    const _namespace = `/ws${namespace}`;
    if (room)
      socketIO
        .of(_namespace)
        .to(room)
        .emit(event, ...args);
    else socketIO.of(_namespace).emit(event, ...args);
    logger.info(
      `[ws:send] Sent '${JSON.stringify(
        args
      )}' to '${_namespace}' socket namespace ${room ? "in room " + room : ""}`
    );
  } else {
    if (room) socketIO.to(room).emit(event, ...args);
    else socketIO.emit(event, ...args);
    logger.info(
      `[ws:send] Sent '${JSON.stringify(args)}' to ${event} (no namespace)`
    );
  }
};
