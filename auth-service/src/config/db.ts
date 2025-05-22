import mongoose from "mongoose";
import { env } from "./env";
import { createLogger } from "../utils/logger";

const logger = createLogger("Database");

/**
 * Get connection string with password inserted from environment
 */
const getConnectionString = (): string => {
  let connectionString = env.dbUri;

  // Replace password placeholder if needed and password is provided
  if (connectionString.includes("Sohail@123") && env.dbPassword) {
    connectionString = connectionString.replace(
      "<db_password>",
      env.dbPassword
    );
  }

  return connectionString;
};

export const connectDB = async (): Promise<void> => {
  try {
    const connectionString = getConnectionString();

    // Don't log the full connection string with password for security
    logger.info(
      `Connecting to MongoDB: ${connectionString.split("@")[1] || "localhost"}`
    );

    await mongoose.connect(connectionString, {
      // These are automatically set in newer Mongoose versions
      autoIndex: env.nodeEnv !== "production",
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
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
