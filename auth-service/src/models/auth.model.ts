import mongoose, { Schema } from "mongoose";
import { IAuth } from "../interfaces/auth.interface";

const AuthSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
  },
  loginProvider: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    default: "user",
  },
  permissions: {
    type: [String],
    default: [],
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  refreshTokens: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better performance
AuthSchema.index({ email: 1 }, { unique: true });
AuthSchema.index({ userId: 1 }, { unique: true });
AuthSchema.index({ verificationToken: 1 }, { sparse: true });

export default mongoose.model<IAuth>("Auth", AuthSchema);
