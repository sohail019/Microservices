import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import {
  LoginDto,
  OAuthLoginDto,
  TokenDto,
  VerifyEmailDto,
} from "../interfaces/auth.interface";
import { AUTH_ERRORS } from "../config/constants";
import { createLogger } from "../utils/logger";

const logger = createLogger("AuthController");

/**
 * Login with email and password
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials: LoginDto = req.body;

    const result = await authService.login(credentials);

    res.status(200).json(result);
  } catch (error) {
    logger.error("Login error:", error);
    res
      .status(401)
      .json({ error: error.message || AUTH_ERRORS.INVALID_CREDENTIALS });
  }
};

/**
 * Login with OAuth provider (Google, Apple, etc.)
 */
export const oauthLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const oauthData: OAuthLoginDto = req.body;

    const result = await authService.oauthLogin(oauthData);

    res.status(200).json(result);
  } catch (error) {
    logger.error("OAuth login error:", error);
    res
      .status(401)
      .json({ error: error.message || AUTH_ERRORS.INVALID_CREDENTIALS });
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: AUTH_ERRORS.UNAUTHORIZED });
      return;
    }

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const result = await authService.logout(refreshToken, userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tokenData: TokenDto = req.body;

    if (!tokenData.refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const result = await authService.refreshToken(tokenData);

    res.status(200).json(result);
  } catch (error) {
    logger.error("Token refresh error:", error);
    res.status(401).json({ error: error.message || AUTH_ERRORS.INVALID_TOKEN });
  }
};

/**
 * Verify user's email with token
 */
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token }: VerifyEmailDto = req.body;

    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }

    const result = await authService.verifyEmail(token);

    res.status(200).json(result);
  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const result = await authService.sendVerificationEmail(email);

    res.status(200).json(result);
  } catch (error) {
    logger.error("Resend verification email error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get user's authentication status
 */
export const getAuthStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: AUTH_ERRORS.UNAUTHORIZED });
      return;
    }

    const result = await authService.getAuthStatus(userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error("Get auth status error:", error);
    res.status(404).json({ error: error.message });
  }
};

/**
 * Validate a token (for external services)
 */
export const validateToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: AUTH_ERRORS.UNAUTHORIZED });
      return;
    }

    const decoded = await authService.verifyAccessToken(token);

    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    logger.error("Token validation error:", error);
    res.status(401).json({ valid: false, error: error.message });
  }
};

/**
 * Register a new user with email and password
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      const result = await authService.register({
        email,
        password,
        name,
      });

      res.status(201).json(result);
    } catch (error) {
      if (error.message === "Email already registered") {
        res.status(409).json({ error: error.message });
      } else if (error.message === "Failed to create user account") {
        res.status(503).json({
          error: "User service unavailable. Please try again later.",
        });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};
