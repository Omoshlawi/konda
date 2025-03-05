import express from "express";
import { createServer, Server } from "http";

type ExpressHttpServer = {
  expressApp: express.Application;
  httpServer: Server;
};

const createExpressHttpServer = () => {
  const expressApp = express();
  const httpServer = createServer(expressApp);
  return { expressApp, httpServer };
};

const globalForExpressHttpServer = global as unknown as {
  expressHttpServer: ExpressHttpServer;
};

const expressHttpServer =
  globalForExpressHttpServer.expressHttpServer || createExpressHttpServer();

if (process.env.NODE_ENV !== "production")
  globalForExpressHttpServer.expressHttpServer = expressHttpServer;

export default expressHttpServer;
