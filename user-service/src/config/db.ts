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
      // These options are set automatically in newer Mongoose versions
      autoIndex: env.nodeEnv !== "production", // Don't build indexes in production
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 30000, // Close sockets after 30 seconds of inactivity
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
