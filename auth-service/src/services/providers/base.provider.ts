import { createLogger } from "../../utils/logger";

const logger = createLogger("AuthProvider");

/**
 * Base authentication provider interface
 */
export interface AuthProvider {
  authenticate(credentials: any): Promise<any>;
  validateCredentials(credentials: any): boolean;
  extractUserInfo(data: any): any;
}

/**
 * Base authentication provider with common methods
 */
export abstract class BaseAuthProvider implements AuthProvider {
  /**
   * Authenticate with the provider
   */
  abstract authenticate(credentials: any): Promise<any>;

  /**
   * Validate credentials format
   */
  abstract validateCredentials(credentials: any): boolean;

  /**
   * Extract user information from provider response
   */
  abstract extractUserInfo(data: any): any;

  /**
   * Log authentication attempt (for audit purposes)
   */
  protected logAuthAttempt(
    provider: string,
    identifier: string,
    success: boolean
  ): void {
    if (success) {
      logger.info(
        `Successful authentication via ${provider} for ${identifier}`
      );
    } else {
      logger.warn(`Failed authentication via ${provider} for ${identifier}`);
    }
  }
}
