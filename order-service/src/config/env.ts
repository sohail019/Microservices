import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const env = {
  // Server
  port: process.env.PORT || 3005,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  dbUri:
    process.env.DB_URI ||
    "mongodb+srv://sohail019:Sohail123@cluster0.3xddwjw.mongodb.net/order_service?",
  
  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // Services
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:3002",
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || "http://localhost:3003",
  cartServiceUrl: process.env.CART_SERVICE_URL || "http://localhost:3004",
};