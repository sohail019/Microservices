// filepath: src/config/env.ts
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const env = {
  // Server
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  dbUri:
    process.env.DB_URI ||
    "mongodb+srv://sohail019:Sohail123@cluster0.3xddwjw.mongodb.net/user_service?",
  dbName: process.env.DB_NAME || "user_service",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // Services
  authServiceUrl:
    process.env.AUTH_SERVICE_URL ||
    "http://ec2-107-20-162-76.compute-1.amazonaws.com:3001",
};
