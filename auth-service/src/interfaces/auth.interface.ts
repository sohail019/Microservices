import { Document } from "mongoose";

export interface IAuth extends Document {
  userId: string;
  email: string;
  passwordHash?: string;
  loginProvider: string;
  isVerified: boolean;
  isActive: boolean;
  role: string;
  permissions: string[];
  lastLoginAt: Date | null;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface OAuthLoginDto {
  provider: string;
  token: string;
}

export interface TokenDto {
  refreshToken: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}
