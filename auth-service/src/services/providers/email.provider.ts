import bcrypt from "bcrypt";
import { BaseAuthProvider } from "./base.provider";
import AuthModel from "../../models/auth.model";
import { LoginDto } from "../../interfaces/auth.interface";
import { AUTH_ERRORS } from "../../config/constants";
import { createLogger } from "../../utils/logger";

const logger = createLogger("EmailAuthProvider");

/**
 * Email and password authentication provider
 */
export class EmailAuthProvider extends BaseAuthProvider {
  /**
   * Authenticate user with email and password
   */
  async authenticate(credentials: LoginDto): Promise<any> {
    try {
      if (!this.validateCredentials(credentials)) {
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      const { email, password } = credentials;

      // Find user by email
      const auth = await AuthModel.findOne({ email });
      if (!auth) {
        this.logAuthAttempt("email", email, false);
        throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
      }

      // Check password
      if (!auth.passwordHash) {
        this.logAuthAttempt("email", email, false);
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      const isMatch = await bcrypt.compare(password, auth.passwordHash);
      if (!isMatch) {
        this.logAuthAttempt("email", email, false);
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      // Check if account is active
      if (!auth.isActive) {
        this.logAuthAttempt("email", email, false);
        throw new Error(AUTH_ERRORS.ACCOUNT_DEACTIVATED);
      }

      // Update last login time
      auth.lastLoginAt = new Date();
      await auth.save();

      this.logAuthAttempt("email", email, true);

      return auth;
    } catch (error) {
      logger.error("Email authentication error:", error);
      throw error;
    }
  }

  /**
   * Validate email and password format
   */
  validateCredentials(credentials: LoginDto): boolean {
    // Basic validation
    if (!credentials || !credentials.email || !credentials.password) {
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(credentials.email);
  }

  /**
   * Extract user information from auth record
   */
  extractUserInfo(auth: any): any {
    return {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      permissions: auth.permissions,
      isVerified: auth.isVerified,
    };
  }
}
