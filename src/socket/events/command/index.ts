import logger from "@/services/logger";
import { DefaultEventsMap, Socket } from "socket.io";
import { onCommand } from "./cmd-handlers";

const commandEvents = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  // receives socket object that is contexted to the namespace, any emit gies only to namespace cmd
  logger.info(
    `New Client comnnected to command namespace: ${socket.conn.remoteAddress}`
  );
  socket.on("new_connection", (connectedClient) => {
    socket.broadcast.emit("new_connection", connectedClient);
  });
  socket.on("cmd", (cmd) => onCommand(socket, cmd));

  socket.on("disconnect", () => {
    logger.info("WebSocket client disconnected");
    socket.broadcast.emit("disconnection", "Client disconnected");
  });
};

export default commandEvents;
