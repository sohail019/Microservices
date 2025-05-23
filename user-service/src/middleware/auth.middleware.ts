import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const logger = createLogger("AuthMiddleware");

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Extract safe properties from error for logging
 */
const extractErrorInfo = (error: any): object => {
  if (!error) return { message: "Unknown error" };

  const errorInfo: Record<string, any> = {};

  // Include basic error properties
  if (error.message) errorInfo.message = error.message;
  if (error.name) errorInfo.name = error.name;
  if (error.code) errorInfo.code = error.code;

  // For Axios errors, extract relevant data without circular references
  if (axios.isAxiosError(error)) {
    errorInfo.isAxiosError = true;

    if (error.response) {
      errorInfo.status = error.response.status;
      errorInfo.statusText = error.response.statusText;
      errorInfo.data = error.response.data;
    }

    if (error.config) {
      errorInfo.url = error.config.url;
      errorInfo.method = error.config.method;
      // Don't include config.headers as it might contain sensitive data
    }
  }

  return errorInfo;
};

/**
 * Authentication middleware that validates JWT tokens with the auth service
 * This doesn't handle authentication itself, but verifies tokens with auth-service
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from request header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authentication token is required",
        },
      });
      return;
    }

    try {
      // Validate token with auth-service
      const response = await axios.post(
        `${env.authServiceUrl}/api/auth/validate-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.valid) {
        // Token is valid, attach user info to request
        req.user = response.data.user;
        next();
      } else {
        // Token is invalid
        logger.warn("Invalid token received");
        res.status(401).json({
          success: false,
          error: {
            message: "Invalid or expired token",
          },
        });
      }
    } catch (error) {
      // Safely extract error information
      const errorInfo = extractErrorInfo(error);
      logger.error("Error validating token with auth service:", errorInfo);

      // Check if it's a connection error
      if (axios.isAxiosError(error) && !error.response) {
        res.status(503).json({
          success: false,
          error: {
            message: "Auth service is unavailable, please try again later",
          },
        });
        return;
      }

      // Regular authentication error
      res.status(401).json({
        success: false,
        error: {
          message: "Authentication failed",
        },
      });
    }
  } catch (error) {
    // Safely extract error information
    const errorInfo = extractErrorInfo(error);
    logger.error("Auth middleware error:", errorInfo);

    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
      },
    });
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
        },
      });
      return;
    }

    if (req.user.role !== role && req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: {
          message: "Forbidden",
        },
      });
      return;
    }

    next();
  };
};
