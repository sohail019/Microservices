import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const env = {
  // Server
  port: process.env.PORT || 3006,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  dbUri:
    process.env.DB_URI ||
    "mongodb+srv://sohail019:Sohail123@cluster0.3xddwjw.mongodb.net/payment_service?",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // Services
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:3002",
  orderServiceUrl: process.env.ORDER_SERVICE_URL || "http://localhost:3005",

  // Payment Gateways
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
  },
};
