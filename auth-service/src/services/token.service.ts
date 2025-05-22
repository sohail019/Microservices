import jwt, { Secret, SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { TOKEN_TYPES, AUTH_ERRORS } from "../config/constants";
import TokenModel from "../models/token.model";
import AuthModel from "../models/auth.model";
import { TokenPayload, TokenResponse } from "../interfaces/token.interface";
import { createLogger } from "../utils/logger";

const logger = createLogger("TokenService");

/**
 * Generate JWT access and refresh tokens
 */
export const generateTokens = async (
  payload: Omit<TokenPayload, "type">
): Promise<TokenResponse> => {
  try {
    const accessPayload: TokenPayload = {
      ...payload,
      type: TOKEN_TYPES.ACCESS,
    };

    const refreshPayload: TokenPayload = {
      userId: payload.userId,
      type: TOKEN_TYPES.REFRESH,
    };

    // Define options separately to help TypeScript understand the types
    const accessOptions: SignOptions = {
      expiresIn: (env.jwtAccessExpiry || "1h") as jwt.SignOptions["expiresIn"],
    };

    const refreshOptions: SignOptions = {
      expiresIn: (env.jwtRefreshExpiry || "7d") as jwt.SignOptions["expiresIn"],
    };

    // Use explicit typing for the sign call
    const accessToken = jwt.sign(
      accessPayload,
      env.jwtSecret as Secret,
      accessOptions
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      env.refreshSecret as Secret,
      refreshOptions
    );

    // Store refresh token in both the user document and token collection
    const auth = await AuthModel.findOne({ userId: payload.userId });
    if (!auth) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    auth.refreshTokens = auth.refreshTokens || [];
    auth.refreshTokens.push(refreshToken);

    // Keep maximum 5 refresh tokens per user
    while (auth.refreshTokens.length > 5) {
      const oldToken = auth.refreshTokens.shift();
      if (oldToken) {
        await revokeToken(oldToken);
      }
    }

    // Also store token details in the token collection for better querying
    await TokenModel.create({
      token: refreshToken,
      userId: payload.userId,
      type: TOKEN_TYPES.REFRESH,
      expiresAt: new Date((jwt.decode(refreshToken) as any).exp * 1000),
      isRevoked: false,
    });

    await auth.save();

    // Calculate expiry in seconds for client convenience
    const decodedToken = jwt.decode(accessToken) as any;
    const expiresIn =
      decodedToken && decodedToken.exp
        ? decodedToken.exp - Math.floor(Date.now() / 1000)
        : 3600;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  } catch (error) {
    logger.error("Error generating tokens:", error);
    throw error;
  }
};

/**
 * Verify a JWT token
 */
export const verifyToken = (
  token: string,
  type: string = TOKEN_TYPES.ACCESS
): any => {
  try {
    const secret =
      type === TOKEN_TYPES.REFRESH ? env.refreshSecret : env.jwtSecret;
    // Add the type casting here too
    return jwt.verify(token, secret as Secret);
  } catch (error) {
    logger.error("Token verification failed:", error);
    throw new Error(AUTH_ERRORS.INVALID_TOKEN);
  }
};

/**
 * Refresh tokens using a valid refresh token
 */
export const refreshAuthTokens = async (
  refreshToken: string
): Promise<TokenResponse> => {
  try {
    // Verify refresh token
    const decoded = verifyToken(
      refreshToken,
      TOKEN_TYPES.REFRESH
    ) as TokenPayload;

    if (decoded.type !== TOKEN_TYPES.REFRESH) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    // Check if token is revoked
    const isRevoked = await isTokenRevoked(refreshToken);
    if (isRevoked) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    // Get user with this refresh token
    const auth = await AuthModel.findOne({
      userId: decoded.userId,
      refreshTokens: refreshToken,
    });

    if (!auth) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    // Generate new tokens
    const tokenPayload = {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      permissions: auth.permissions,
    };

    const tokens = await generateTokens(tokenPayload);

    // Replace the old refresh token with the new one
    const tokenIndex = auth.refreshTokens.indexOf(refreshToken);
    auth.refreshTokens.splice(tokenIndex, 1, tokens.refreshToken);
    await auth.save();

    return tokens;
  } catch (error) {
    logger.error("Token refresh failed:", error);

    // Cleanup if token exists but there's another error
    try {
      const decoded = jwt.decode(refreshToken) as any;
      if (decoded && decoded.userId) {
        await AuthModel.findOneAndUpdate(
          { userId: decoded.userId },
          { $pull: { refreshTokens: refreshToken } }
        );
      }
    } catch (e) {
      // Ignore any errors in cleanup
    }

    throw new Error(AUTH_ERRORS.INVALID_TOKEN);
  }
};

/**
 * Revoke a token (add to blacklist)
 */
export const revokeToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.exp) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    const expiresAt = new Date(decoded.exp * 1000);

    await TokenModel.findOneAndUpdate(
      { token },
      {
        token,
        userId: decoded.userId || "unknown",
        type: decoded.type || "unknown",
        expiresAt,
        isRevoked: true,
      },
      { upsert: true, new: true }
    );

    // Also remove from user's refresh tokens if it's there
    if (decoded.userId) {
      await AuthModel.findOneAndUpdate(
        { userId: decoded.userId },
        { $pull: { refreshTokens: token } }
      );
    }
  } catch (error) {
    logger.error("Token revocation failed:", error);
    throw error;
  }
};

/**
 * Check if a token is revoked
 */
export const isTokenRevoked = async (token: string): Promise<boolean> => {
  const revokedToken = await TokenModel.findOne({ token, isRevoked: true });
  return !!revokedToken;
};

/**
 * Generate a random verification token
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
