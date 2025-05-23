import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createLogger } from "../utils/logger";
import { errorResponse } from "../utils/response";

const logger = createLogger("AuthMiddleware");

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware that validates JWT tokens
 * This doesn't handle authentication itself, just checks token presence
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
      res.status(401).json(errorResponse("Authentication token is required"));
      return;
    }

    try {
      // Simply decode the token without validation (validation is done by auth-service)
      const decoded = jwt.decode(token);

      if (!decoded || typeof decoded !== "object") {
        res.status(401).json(errorResponse("Invalid token format"));
        return;
      }

      // Attach the user info to request
      req.user = decoded;
      next();
    } catch (error) {
      logger.error("Token decoding error:", error);
      res.status(401).json(errorResponse("Invalid authentication token"));
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(500).json(errorResponse("Internal server error"));
  }
};

/**
 * Middleware to check if the user has admin role
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json(errorResponse("Admin access required"));
  }
};

/**
 * Middleware to check if user is accessing their own resources
 */
export const isSameUserOrAdmin = (idParam: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramId = req.params[idParam];

    if (
      req.user &&
      (req.user.role === "admin" || req.user.userId === paramId)
    ) {
      next();
    } else {
      res
        .status(403)
        .json(
          errorResponse("You don't have permission to access this resource")
        );
    }
  };
};
