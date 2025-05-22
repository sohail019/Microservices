import dotenv from "dotenv";
import { Secret } from "jsonwebtoken";

// Load environment variables
dotenv.config();

export const env = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  dbUri:
    process.env.DB_URI ||
    (process.env.NODE_ENV === "production"
      ? "mongodb+srv://sohail019:Sohail@123@cluster0.3xddwjw.mongodb.net/auth_service?retryWrites=true&w=majority&appName=Cluster0"
      : "mongodb://localhost:27017/auth_service"),
  dbPassword: process.env.DB_PASSWORD || "",

  // JWT
  jwtSecret: (process.env.JWT_SECRET || "default_jwt_secret") as Secret,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "1h",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  refreshSecret: (process.env.REFRESH_SECRET ||
    "default_refresh_secret") as Secret,

  // OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  appleClientId: process.env.APPLE_CLIENT_ID || "",
  appleClientSecret: process.env.APPLE_CLIENT_SECRET || "",

  // Services
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:3002/api",
};
