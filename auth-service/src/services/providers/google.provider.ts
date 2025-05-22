import axios from "axios";
import { BaseAuthProvider } from "./base.provider";
import { env } from "../../config/env";
import { AUTH_ERRORS } from "../../config/constants";
import { createLogger } from "../../utils/logger";

const logger = createLogger("GoogleAuthProvider");

/**
 * Google OAuth authentication provider
 */
export class GoogleAuthProvider extends BaseAuthProvider {
  /**
   * Authenticate user with Google OAuth token
   */
  async authenticate(credentials: { token: string }): Promise<any> {
    try {
      if (!this.validateCredentials(credentials)) {
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      const { token } = credentials;

      // Verify token with Google
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
      );

      const { data } = response;

      // Verify that the audience matches our client ID
      if (data.aud !== env.googleClientId) {
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      // Extract user info
      const userInfo = this.extractUserInfo(data);

      this.logAuthAttempt("google", userInfo.email, true);

      return userInfo;
    } catch (error) {
      logger.error("Google authentication error:", error);
      this.logAuthAttempt("google", "unknown", false);
      throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
  }

  /**
   * Validate OAuth token format
   */
  validateCredentials(credentials: { token: string }): boolean {
    return !!(
      credentials &&
      credentials.token &&
      credentials.token.length > 20
    );
  }

  /**
   * Extract user information from Google response
   */
  extractUserInfo(data: any): any {
    return {
      externalId: data.sub,
      email: data.email,
      name: data.name,
      isVerified: data.email_verified === "true",
      picture: data.picture,
    };
  }
}
