import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Apply stricter rate limits in production
const isProduction = env.nodeEnv === "production";

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/**
 * More restrictive rate limiter for authentication operations
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProduction ? 10 : 100, // 10 login attempts per hour in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

/**
 * Rate limiter for account operations like email verification
 */
export const accountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProduction ? 5 : 50, // 5 attempts per hour in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts, please try again later." },
});
