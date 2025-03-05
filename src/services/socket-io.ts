import { Server as SocketIOServer } from "socket.io";
import expressHttpServer from "./express-http-server";

const globalForSocketIO = global as unknown as { socketIO: SocketIOServer };

const socketIO =
  globalForSocketIO.socketIO ||
  new SocketIOServer(expressHttpServer.httpServer, {
    /* option */
  });

if (process.env.NODE_ENV !== "production")
  globalForSocketIO.socketIO = socketIO;

export default socketIO;
