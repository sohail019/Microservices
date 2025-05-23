import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { createLogger } from "./utils/logger";

const logger = createLogger("Server");
const PORT = env.port;

// Connect to database
connectDB()
  .then(() => {
    // Start server after successful database connection
    app.listen(PORT, () => {
      logger.info(
        `Product service running on port ${PORT} in ${env.nodeEnv} mode`
      );
    });
  })
  .catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
  });

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", { reason, promise });
  process.exit(1);
});
