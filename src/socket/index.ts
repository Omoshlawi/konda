import socketIO from "@/services/socket-io";
import { commandEvents } from "./events";
import chatsEvents from "./events/chats";

export const setUpSocketNamespacesAndSubscribeToEvents = () => {
  // Namespace management
  const chatNamespace = socketIO.of("/ws/chat");
  const commandsNamespace = socketIO.of("/ws/cmd");

  // Register events for different namespaces
  commandsNamespace.on("connection", commandEvents);
  chatNamespace.on("connection", chatsEvents);
};

export const sendSocketMessage = (
  event: string,
  namespace?: string,
  ...args: any[]
) => {
  if (namespace) {
    socketIO.of(namespace).emit(event, ...args);
  } else {
    socketIO.emit(event, ...args);
  }
};
