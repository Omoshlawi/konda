import socketIO from "@/services/socket-io";
import { commandEvents } from "./events";
import chatsEvents from "./events/chats";
import logger from "@/services/logger";

export const setUpSocketNamespacesAndSubscribeToEvents = () => {
  // Namespace management
  const chatNamespace = socketIO.of("/ws/chat");
  const commandsNamespace = socketIO.of("/ws/cmd");

  // Register events for different namespaces
  commandsNamespace.on("connection", commandEvents);
  chatNamespace.on("connection", chatsEvents);
  logger.info("Loaded namespaces and events, waiting client connections");
};

export const sendSocketMessage = (
  event: string,
  namespace?: string,
  ...args: any[]
) => {
  if (namespace) {
    const _namespace = `/ws${namespace}`;
    socketIO.of(_namespace).emit(event, ...args);
    logger.info(
      `[ws:send] Sent '${JSON.stringify(
        args
      )}' to '${_namespace}' socket namespace`
    );
  } else {
    socketIO.emit(event, ...args);
    logger.info(
      `[ws:send] Sent '${JSON.stringify(args)}' to ${event} (no namespace)`
    );
  }
};
