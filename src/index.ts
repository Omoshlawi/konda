import "dotenv/config";

import logger from "@/services/logger";

import ApplicationServer from "@/app";

// Start the server
const startServer = async () => {
  try {
    const server = new ApplicationServer();
    await server.start();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
