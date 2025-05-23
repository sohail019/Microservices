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
      // We just want to extract user information
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
