import express, { Application } from "express";
import { createServer, Server } from "http";
import { configuration } from "@/utils/constants";
import morgan from "morgan";
import cors from "cors";
import { toNumber } from "lodash";
import logger from "@/services/logger";
import router from "@/routes";
import { handleErrorsMiddleWare, cookieToHeader } from "@/middlewares";
import { setUpSocketNamespacesAndSubscribeToEvents } from "@/socket";
import { subscribeToMQTTTopicsAndEvents } from "@/queue";
import expressHttpServer from "@/services/express-http-server";
import cookieParser from "cookie-parser";

export interface ServerAddress {
  address: string;
  port: number;
}

export default class ApplicationServer {
  private app: Application;
  private httpServer: Server;

  constructor() {
    this.app = expressHttpServer.expressApp;
    this.httpServer = expressHttpServer.httpServer;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
    this.subscribeToMqtt();
    this.initializeSocketIo();
  }

  private initializeSocketIo() {
    logger.info(
      `[+]${configuration.name}:${configuration.version} Initializing socketio server`
    );
    setUpSocketNamespacesAndSubscribeToEvents();
  }

  private subscribeToMqtt() {
    logger.info(
      `[+]${configuration.name}:${configuration.version} Subscribing to mqtt topics`
    );
    subscribeToMQTTTopicsAndEvents();
  }

  private setupMiddlewares(): void {
    if (this.app.get("env") === "development") {
      this.app.use(morgan("tiny"));
      logger.info(
        `[+]${configuration.name}:${configuration.version} enable morgan`
      );
    }
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(configuration.auth.auth_secrete));
    this.app.use(cookieToHeader); // Convert session cookie to session header
  }

  private setupRoutes(): void {
    // Add routes here
    this.app.use("/api", router);

    // Default 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ detail: "Not Found" });
    });
  }

  private setupErrorHandlers(): void {
    this.app.use(handleErrorsMiddleWare);
  }

  private getServerAddress(): ServerAddress {
    const address = this.httpServer.address();

    if (!address) {
      throw new Error("Could not determine server address");
    }

    if (typeof address === "string") {
      return {
        address: "localhost",
        port: toNumber(configuration.port ?? 0),
      };
    }

    return {
      address: address.address || "localhost",
      port: address.port,
    };
  }

  public async start(): Promise<void> {
    const port = configuration.port ?? 0;

    return new Promise((resolve, reject) => {
      this.httpServer.listen(port, () => {
        try {
          const serverAddress = this.getServerAddress();
          const bind =
            typeof serverAddress === "string"
              ? `pipe ${serverAddress}`
              : `port ${serverAddress.port}`;

          logger.info(
            `[+]${configuration.name}:${configuration.version} listening on ${bind}`
          );
        } catch (error) {
          reject(error);
        }
      });

      this.httpServer.on("error", (error) => {
        reject(error);
      });
    });
  }
}
