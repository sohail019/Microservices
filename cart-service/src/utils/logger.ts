import winston from "winston";
import { env } from "../config/env";

/**
 * Create a logger instance with the specified category
 */
export const createLogger = (category: string) => {
  const isProd = env.nodeEnv === "production";

  return winston.createLogger({
    level: env.logLevel || (isProd ? "info" : "debug"),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata(),
      winston.format.json()
    ),
    defaultMeta: { service: "cart-service", category },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, category, metadata }) => {
              let logMessage = `${timestamp} ${level} [${category}]: ${message}`;

              // Add metadata but filter out large objects
              if (metadata && Object.keys(metadata).length > 0) {
                // Filter out sensitive information
                // const safeMetadata = { ...metadata };

                // Don't print big objects
                const metadataStr = JSON.stringify(metadata, (key, value) => {
                  if (typeof value === "string" && value.length > 100) {
                    return value.substring(0, 50) + "...";
                  }
                  return value;
                });

                logMessage += ` ${metadataStr}`;
              }

              return logMessage;
            }
          )
        ),
      }),
    ],
  });
};
