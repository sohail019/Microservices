import mongoose from "mongoose";
import User from "../models/user.model";
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateAddressDto,
  UpdatePreferencesDto,
  UserQueryParams,
} from "../interfaces/user.interface";
import { USER_ERRORS, PAGINATION_DEFAULTS } from "../config/constants";
import { createLogger } from "../utils/logger";

const logger = createLogger("UserService");

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserDto) => {
  try {
    logger.debug("Creating new user", { email: userData.email });

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      logger.warn("User creation failed - email already exists", {
        email: userData.email,
      });
      throw new Error(USER_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    // Check if user already exists with this authId
    const existingAuthUser = await User.findOne({ authId: userData.authId });
    if (existingAuthUser) {
      logger.warn("User creation failed - authId already exists", {
        authId: userData.authId,
      });
      throw new Error("User with this authentication ID already exists");
    }

    // Create and save the user
    const user = new User(userData);
    await user.save();

    logger.info("User created successfully", {
      id: user.id,
      email: user.email,
    });
    return user;
  } catch (error) {
    logger.error("Error creating user:", error);
    throw error;
  }
};

/**
 * Get all users with filters/pagination
 */
export const getUsers = async (query: UserQueryParams = {}) => {
  try {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
      email,
      fullName,
      phone,
      isProfileComplete,
    } = query;

    logger.debug("Fetching users with query", { page, limit, sort });

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (email) filter.email = { $regex: email, $options: "i" };
    if (fullName) filter.fullName = { $regex: fullName, $options: "i" };
    if (phone) filter.phone = { $regex: phone, $options: "i" };
    if (isProfileComplete !== undefined)
      filter.isProfileComplete = isProfileComplete;

    // Execute query with pagination
    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const total = await User.countDocuments(filter);

    logger.info("Users fetched successfully", { count: users.length, total });

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching users:", error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string) => {
  try {
    logger.debug("Fetching user by ID", { id });

    const user = await User.findById(id).lean();

    if (!user) {
      logger.warn("User not found", { id });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User fetched successfully", { id });
    return user;
  } catch (error) {
    logger.error("Error fetching user by ID:", error);
    throw error;
  }
};

/**
 * Get user by auth ID (from auth service)
 */
export const getUserByAuthId = async (authId: string) => {
  try {
    logger.debug("Fetching user by authId", { authId });

    const user = await User.findOne({ authId }).lean();

    if (!user) {
      logger.warn("User not found by authId", { authId });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User fetched successfully by authId", { authId });
    return user;
  } catch (error) {
    logger.error("Error fetching user by authId:", error);
    throw error;
  }
};

/**
 * Update user by ID
 */
export const updateUserById = async (id: string, updateData: UpdateUserDto) => {
  try {
    logger.debug("Updating user", { id });

    // Find and update the user, returning the updated document
    const user = await User.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      logger.warn("Update failed - user not found", { id });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User updated successfully", { id });
    return user;
  } catch (error) {
    logger.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Update user by authId
 */
export const updateUserByAuthId = async (
  authId: string,
  updateData: UpdateUserDto
) => {
  try {
    logger.debug("Updating user by authId", { authId });

    const user = await User.findOneAndUpdate(
      { authId },
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      logger.warn("Update failed - user not found by authId", { authId });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User updated successfully by authId", { authId });
    return user;
  } catch (error) {
    logger.error("Error updating user by authId:", error);
    throw error;
  }
};

/**
 * Update user address
 */
export const updateUserAddress = async (
  id: string,
  addressData: UpdateAddressDto
) => {
  try {
    logger.debug("Updating user address", { id });

    const user = await User.findByIdAndUpdate(
      id,
      {
        address: addressData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      logger.warn("Address update failed - user not found", { id });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User address updated successfully", { id });
    return user;
  } catch (error) {
    logger.error("Error updating user address:", error);
    throw error;
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  id: string,
  preferencesData: UpdatePreferencesDto
) => {
  try {
    logger.debug("Updating user preferences", { id });

    const user = await User.findByIdAndUpdate(
      id,
      {
        preferences: preferencesData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      logger.warn("Preferences update failed - user not found", { id });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User preferences updated successfully", { id });
    return user;
  } catch (error) {
    logger.error("Error updating user preferences:", error);
    throw error;
  }
};

/**
 * Update user profile image
 */
export const updateProfileImage = async (id: string, profileImage: string) => {
  try {
    logger.debug("Updating user profile image", { id });

    const user = await User.findByIdAndUpdate(
      id,
      {
        profileImage,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      logger.warn("Profile image update failed - user not found", { id });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User profile image updated successfully", { id });
    return user;
  } catch (error) {
    logger.error("Error updating user profile image:", error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: string) => {
  try {
    logger.debug("Deleting user", { id });

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      logger.warn("Delete failed - user not found", { id });
      throw new Error(USER_ERRORS.USER_NOT_FOUND);
    }

    logger.info("User deleted successfully", { id });
    return { message: "User deleted successfully" };
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw error;
  }
};
