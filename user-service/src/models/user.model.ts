import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";

const UserSchema: Schema = new Schema({
  authId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    default: "",
  },
  profileImage: {
    type: String,
    default: "",
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  address: {
    street: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    postalCode: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
  },
  preferences: {
    theme: {
      type: String,
      default: "light",
    },
    language: {
      type: String,
      default: "en",
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
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

// Index for performance optimization
UserSchema.index({ fullName: "text", email: "text" });
UserSchema.index({ authId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

// Middleware to check if profile is complete before save
UserSchema.pre("save", function (next) {
  const user = this as unknown as IUser;

  // Check if essential fields are filled
  const hasFullName = !!user.fullName;
  const hasEmail = !!user.email;
  const hasPhone = !!user.phone;
  const hasAddress = !!(user.address.city && user.address.country);

  // Update isProfileComplete flag
  user.isProfileComplete = hasFullName && hasEmail && hasPhone && hasAddress;

  // Update the updatedAt timestamp
  user.updatedAt = new Date();

  next();
});

export default mongoose.model<IUser>("User", UserSchema);
