import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/payment.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { createLogger } from "./utils/logger";

const logger = createLogger("App");

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/payments", paymentRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "payment-service" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "payment-service",
    version: "1.0.0",
    status: "running",
  });
});

// Handle 404 errors
app.use("*", notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
