import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { AUTH_ERRORS } from "../config/constants";
import { createLogger } from "../utils/logger";

const logger = createLogger("AuthMiddleware");

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: AUTH_ERRORS.UNAUTHORIZED });
      return;
    }

    try {
      const decoded = await authService.verifyAccessToken(token);

      // Add user info to request object
      req.user = decoded;
      next();
    } catch (error) {
      logger.error("Authentication failed:", error);
      res.status(401).json({ error: AUTH_ERRORS.INVALID_TOKEN });
    }
  } catch (error) {
    logger.error("Authentication middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: AUTH_ERRORS.UNAUTHORIZED });
      return;
    }

    if (req.user.role !== role && req.user.role !== "admin") {
      res.status(403).json({ error: AUTH_ERRORS.FORBIDDEN });
      return;
    }

    next();
  };
};

/**
 * Check if user has required permission
 */
export const hasPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: AUTH_ERRORS.UNAUTHORIZED });
      return;
    }

    if (
      req.user.role === "admin" ||
      (req.user.permissions && req.user.permissions.includes(permission))
    ) {
      next();
    } else {
      res.status(403).json({ error: AUTH_ERRORS.FORBIDDEN });
    }
  };
};
