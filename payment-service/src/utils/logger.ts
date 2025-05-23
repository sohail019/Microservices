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
    defaultMeta: { service: "payment-service", category },
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

                // if (safeMetadata.error && safeMetadata.error.message) {
                //   safeMetadata.errorMessage = safeMetadata.error.message;
                //   delete safeMetadata.error;
                // }

                // Don't print big objects or sensitive payment data
                const metadataStr = JSON.stringify(metadata, (key, value) => {
                  // Mask sensitive payment data
                  if (key === "cardNumber" && typeof value === "string") {
                    return value.replace(/\d(?=\d{4})/g, "*");
                  }
                  if (
                    (key === "cvv" || key === "cvc") &&
                    typeof value === "string"
                  ) {
                    return "***";
                  }
                  if (key === "password" && typeof value === "string") {
                    return "********";
                  }
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
