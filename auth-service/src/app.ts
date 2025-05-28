import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import { createLogger } from "./utils/logger";

const logger = createLogger("App");

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests
app.use(apiLimiter);

// Routes
// app.use("/api/auth", authRoutes);
app.use("/", authRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "auth-service",
    version: "1.0.0",
    status: "running",
    documentation: "/api-docs",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

// Handle 404 errors
app.use("*", notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
