import logger from "@/services/logger";
import { DefaultEventsMap, Socket } from "socket.io";

const commandEvents = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  socket.broadcast.emit("new_connection", {
    client: socket.client.conn.remoteAddress,
    client1: socket.conn.remoteAddress,
  });
  socket.on("cmd:send", (cmd) => {
    logger.info("Message Received: ", cmd);
    socket.broadcast.emit("cmd:send", cmd);
  });
};

export default commandEvents;
