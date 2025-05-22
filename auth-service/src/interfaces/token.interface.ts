import { Document } from "mongoose";

export interface IToken extends Document {
  token: string;
  userId: string;
  type: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email?: string;
  role?: string;
  permissions?: string[];
  type: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
