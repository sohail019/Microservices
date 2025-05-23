import mongoose from "mongoose";
import { env } from "./env";
import { createLogger } from "../utils/logger";

const logger = createLogger("Database");

/**
 * Get connection string from environment
 */
const getConnectionString = (): string => {
  return env.dbUri;
};

export const connectDB = async (): Promise<void> => {
  try {
    const connectionString = getConnectionString();

    // Don't log the full connection string with credentials for security
    logger.info(
      `Connecting to MongoDB: ${connectionString.split("@")[1] || "localhost"}`
    );

    await mongoose.connect(connectionString, {
      autoIndex: env.nodeEnv !== "production",
    });

    // Set up connection event handlers
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully");
    });

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
