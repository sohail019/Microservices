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
  authServiceUrl:
    process.env.AUTH_SERVICE_URL ||
    "http://ec2-107-20-162-76.compute-1.amazonaws.com:3001",
  userServiceUrl:
    process.env.USER_SERVICE_URL ||
    "http://ec2-23-21-140-204.compute-1.amazonaws.com:3002",
  productServiceUrl:
    process.env.PRODUCT_SERVICE_URL ||
    "http://ec2-44-193-67-192.compute-1.amazonaws.com:3003",
  cartServiceUrl:
    process.env.CART_SERVICE_URL ||
    "http://ec2-3-233-43-35.compute-1.amazonaws.com:3004",
};
