import { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger";
import { errorResponse } from "../utils/response";

const logger = createLogger("ErrorMiddleware");

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res
    .status(500)
    .json(
      errorResponse(
        "Internal Server Error",
        process.env.NODE_ENV === "production" ? undefined : err.message
      )
    );
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);

  res
    .status(404)
    .json(
      errorResponse(
        "Not Found",
        `The requested resource at ${req.path} was not found`
      )
    );
};
