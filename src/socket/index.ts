import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { commandEvents } from "./events";
import chatsEvents from "./events/chats";

export const initSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    /* option */
  });

  // Namespace management
  const chatNamespace = io.of("/chat");
  const commandsNamespace = io.of("/cmd");

  // Register events for different namespaces
  commandsNamespace.on("connection", commandEvents);
  chatNamespace.on("connection", chatsEvents);

  return io;
};
