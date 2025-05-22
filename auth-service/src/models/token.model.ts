import mongoose, { Schema } from "mongoose";
import { IToken } from "../interfaces/token.interface";

const TokenSchema: Schema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better performance
TokenSchema.index({ token: 1 }, { unique: true });
TokenSchema.index({ userId: 1 });
TokenSchema.index({ expiresAt: 1 });

export default mongoose.model<IToken>("Token", TokenSchema);
