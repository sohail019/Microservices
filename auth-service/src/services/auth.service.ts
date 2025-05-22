import axios from "axios";
import mongoose from "mongoose";
import { EmailAuthProvider } from "./providers/email.provider";
import { GoogleAuthProvider } from "./providers/google.provider";
import * as tokenService from "./token.service";
import AuthModel from "../models/auth.model";
import {
  LoginDto,
  OAuthLoginDto,
  TokenDto,
  AuthResponse,
} from "../interfaces/auth.interface";
import {
  AUTH_PROVIDERS,
  AUTH_ERRORS,
  RESPONSE_MESSAGES,
} from "../config/constants";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";
import bcrypt from "bcrypt";

const logger = createLogger("AuthService");

// Initialize auth providers
const providers: Record<string, any> = {
  [AUTH_PROVIDERS.EMAIL]: new EmailAuthProvider(),
  [AUTH_PROVIDERS.GOOGLE]: new GoogleAuthProvider(),
};

/**
 * Authenticate user with email and password
 */
export const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  try {
    // Authenticate using the email provider
    const auth = await providers[AUTH_PROVIDERS.EMAIL].authenticate(
      credentials
    );

    // Generate tokens
    const tokens = await tokenService.generateTokens({
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      permissions: auth.permissions,
    });

    return {
      ...tokens,
      user: {
        id: auth.userId,
        email: auth.email,
        role: auth.role,
        permissions: auth.permissions,
      },
    };
  } catch (error) {
    logger.error("Login error:", error);
    throw error;
  }
};

/**
 * Authenticate using OAuth provider (Google, Apple, etc.)
 */
export const oauthLogin = async (
  data: OAuthLoginDto
): Promise<AuthResponse> => {
  try {
    if (!providers[data.provider]) {
      throw new Error(`Unsupported provider: ${data.provider}`);
    }

    // Authenticate with the specified provider
    const providerData = await providers[data.provider].authenticate({
      token: data.token,
    });

    // Find existing auth record or create one via User Service
    let auth = await AuthModel.findOne({ email: providerData.email });
    if (!auth) {
      // User doesn't exist, we need to register via User Service
      try {
        // Generate a unique ID for the user
        const authUserId = new mongoose.Types.ObjectId().toString();

        // Create new auth record first
        auth = new AuthModel({
          userId: authUserId,
          email: providerData.email,
          loginProvider: data.provider,
          isVerified: providerData.isVerified || false,
          isActive: true,
          role: "user",
          permissions: [],
          lastLoginAt: new Date(),
        });

        await auth.save();

        // Make request to user service to create a new user
        const response = await axios.post(`${env.userServiceUrl}/api/users`, {
          authId: auth.userId,
          email: providerData.email,
          fullName: providerData.name || providerData.email.split("@")[0],
          profileImage: providerData.picture,
        });
      } catch (error) {
        logger.error("Error creating user via user service:", error);
        throw new Error("Failed to create user account");
      }
    } else {
      // Update last login time
      auth.lastLoginAt = new Date();
      await auth.save();
    }

    // Generate tokens
    const tokens = await tokenService.generateTokens({
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      permissions: auth.permissions,
    });

    return {
      ...tokens,
      user: {
        id: auth.userId,
        email: auth.email,
        role: auth.role,
        permissions: auth.permissions,
      },
    };
  } catch (error) {
    logger.error("OAuth login error:", error);
    throw error;
  }
};

/**
 * Logout user by revoking their refresh token
 */
export const logout = async (
  token: string,
  userId: string
): Promise<{ message: string }> => {
  try {
    // Revoke the refresh token
    await tokenService.revokeToken(token);

    return { message: RESPONSE_MESSAGES.LOGOUT_SUCCESS };
  } catch (error) {
    logger.error("Logout error:", error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (
  data: TokenDto
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> => {
  try {
    return await tokenService.refreshAuthTokens(data.refreshToken);
  } catch (error) {
    logger.error("Token refresh error:", error);
    throw error;
  }
};

/**
 * Verify if a token is valid (not expired or revoked)
 */
export const verifyAccessToken = async (token: string): Promise<any> => {
  try {
    // Verify token signature and expiry
    const decoded = tokenService.verifyToken(token);

    // Check if token is revoked
    const isRevoked = await tokenService.isTokenRevoked(token);
    if (isRevoked) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    return decoded;
  } catch (error) {
    logger.error("Token verification error:", error);
    throw error;
  }
};

/**
 * Get auth status for a user
 */
export const getAuthStatus = async (userId: string): Promise<any> => {
  try {
    const auth = await AuthModel.findOne(
      { userId },
      {
        passwordHash: 0,
        refreshTokens: 0,
        verificationToken: 0,
        verificationTokenExpires: 0,
      }
    );

    if (!auth) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return {
      userId: auth.userId,
      email: auth.email,
      loginProvider: auth.loginProvider,
      isVerified: auth.isVerified,
      isActive: auth.isActive,
      role: auth.role,
      permissions: auth.permissions,
      lastLoginAt: auth.lastLoginAt,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    };
  } catch (error) {
    logger.error("Get auth status error:", error);
    throw error;
  }
};

/**
 * Send verification email
 * In a real system, this would send an actual email
 */
export const sendVerificationEmail = async (
  email: string
): Promise<{ message: string; token?: string }> => {
  try {
    const auth = await AuthModel.findOne({ email });

    if (!auth) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    if (auth.isVerified) {
      throw new Error("Email already verified");
    }

    // Generate verification token
    const verificationToken = tokenService.generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Valid for 24 hours

    auth.verificationToken = verificationToken;
    auth.verificationTokenExpires = tokenExpiry;
    await auth.save();

    // In a production environment, send actual email here
    // For development, return the token directly
    return {
      message: RESPONSE_MESSAGES.VERIFICATION_EMAIL_SENT,
      token: env.nodeEnv === "development" ? verificationToken : undefined,
    };
  } catch (error) {
    logger.error("Send verification email error:", error);
    throw error;
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (
  token: string
): Promise<{ message: string }> => {
  try {
    const auth = await AuthModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!auth) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    auth.isVerified = true;
    auth.verificationToken = undefined;
    auth.verificationTokenExpires = undefined;
    await auth.save();

    return { message: "Email verified successfully" };
  } catch (error) {
    logger.error("Email verification error:", error);
    throw error;
  }
};

/**
 * Register a new user with email and password
 */
export const register = async (userData: {
  email: string;
  password: string;
  name?: string;
}): Promise<{
  message: string;
  email: string;
  userId: string;
  verification: {
    required: boolean;
    token?: string;
  };
}> => {
  try {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingAuth = await AuthModel.findOne({ email });
    if (existingAuth) {
      throw new Error("Email already registered");
    }

    // Create user in user-service first
    try {
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);
      // Generate a unique ID for the user
      const authUserId = new mongoose.Types.ObjectId().toString();

      // Create auth record first
      const auth = new AuthModel({
        userId: authUserId,
        email,
        passwordHash,
        loginProvider: AUTH_PROVIDERS.EMAIL,
        isVerified: false,
        isActive: true,
        role: "user",
        permissions: [],
        lastLoginAt: null,
      });

      await auth.save();

      // Make request to user service to create a new user
      const response = await axios.post(`${env.userServiceUrl}/api/users`, {
        authId: auth.userId, // Send the auth userId as authId
        email: email,
        fullName: name || email.split("@")[0],
      });

      // Generate verification token
      const verificationToken = tokenService.generateVerificationToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      auth.verificationToken = verificationToken;
      auth.verificationTokenExpires = tokenExpiry;
      await auth.save();

      // In production, send verification email
      // For development, return token directly
      return {
        message: "User registered successfully. Please verify your email.",
        email: auth.email,
        userId: auth.userId,
        verification: {
          required: true,
          token: env.nodeEnv === "development" ? verificationToken : undefined,
        },
      };
    } catch (error) {
      // Properly handle Axios errors
      if (error.isAxiosError) {
        // Extract only useful information from axios error
        logger.error("User service error:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
      } else {
        // Handle other types of errors
        logger.error("Error creating user:", error.message);
      }

      throw new Error("Failed to create user account");
    }
  } catch (error) {
    // Don't log the error directly - it might contain circular references
    logger.error("Registration error:", error.message);
    throw error;
  }
};
