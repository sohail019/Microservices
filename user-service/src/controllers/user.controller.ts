import { Request, Response } from "express";
import * as userService from "../services/user.service";
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateAddressDto,
  UpdatePreferencesDto,
} from "../interfaces/user.interface";
import { RESPONSE_MESSAGES } from "../config/constants";
import { createLogger } from "../utils/logger";
import { successResponse, errorResponse } from "../utils/response";

const logger = createLogger("UserController");

/**
 * Create a new user
 */
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userData: CreateUserDto = req.body;

    const user = await userService.createUser(userData);

    res.status(201).json(successResponse(user, RESPONSE_MESSAGES.USER_CREATED));
  } catch (error) {
    logger.error("Create user error:", error);

    if (
      error.message === "Email already exists" ||
      error.message === "User with this authentication ID already exists"
    ) {
      res.status(409).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Get all users with filtering/pagination
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
      email: req.query.email as string,
      fullName: req.query.fullName as string,
      phone: req.query.phone as string,
      isProfileComplete: req.query.isProfileComplete
        ? req.query.isProfileComplete === "true"
        : undefined,
    };

    const result = await userService.getUsers(query);

    res.status(200).json(successResponse(result));
  } catch (error) {
    logger.error("Get users error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json(successResponse(user));
  } catch (error) {
    logger.error("Get user by ID error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Get user by Auth ID
 */
export const getUserByAuthId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { authId } = req.params;

    const user = await userService.getUserByAuthId(authId);

    res.status(200).json(successResponse(user));
  } catch (error) {
    logger.error("Get user by auth ID error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Get current user profile (using authId from token)
 */
export const getMyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Auth middleware should set req.user.authId
    const authId = req.user?.id;

    if (!authId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const user = await userService.getUserByAuthId(authId);

    res.status(200).json(successResponse(user));
  } catch (error) {
    logger.error("Get my profile error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update user by ID
 */
export const updateUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateUserDto = req.body;

    const updatedUser = await userService.updateUserById(id, updateData);

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update user by ID error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update current user profile
 */
export const updateMyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.id;

    if (!authId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const updateData: UpdateUserDto = req.body;

    const updatedUser = await userService.updateUserByAuthId(
      authId,
      updateData
    );

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update my profile error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update user address
 */
export const updateUserAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const addressData: UpdateAddressDto = req.body;

    const updatedUser = await userService.updateUserAddress(id, addressData);

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update user address error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update current user address
 */
export const updateMyAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.id;

    if (!authId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // First get the user by auth ID to get the MongoDB _id
    const user = await userService.getUserByAuthId(authId);

    const addressData: UpdateAddressDto = req.body;

    const updatedUser = await userService.updateUserAddress(
      user._id.toString(),
      addressData
    );

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update my address error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const preferencesData: UpdatePreferencesDto = req.body;

    const updatedUser = await userService.updateUserPreferences(
      id,
      preferencesData
    );

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update user preferences error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update current user preferences
 */
export const updateMyPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.id;

    if (!authId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // First get the user by auth ID to get the MongoDB _id
    const user = await userService.getUserByAuthId(authId);

    const preferencesData: UpdatePreferencesDto = req.body;

    const updatedUser = await userService.updateUserPreferences(
      user._id.toString(),
      preferencesData
    );

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update my preferences error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update user profile image
 */
export const updateUserProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { profileImage } = req.body;

    if (!profileImage) {
      res.status(400).json(errorResponse("Profile image URL is required"));
      return;
    }

    const updatedUser = await userService.updateProfileImage(id, profileImage);

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update user profile image error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Update current user profile image
 */
export const updateMyProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.id;

    if (!authId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // First get the user by auth ID to get the MongoDB _id
    const user = await userService.getUserByAuthId(authId);

    const { profileImage } = req.body;

    if (!profileImage) {
      res.status(400).json(errorResponse("Profile image URL is required"));
      return;
    }

    const updatedUser = await userService.updateProfileImage(
      user._id.toString(),
      profileImage
    );

    res
      .status(200)
      .json(successResponse(updatedUser, RESPONSE_MESSAGES.USER_UPDATED));
  } catch (error) {
    logger.error("Update my profile image error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Delete user
 */
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    res.status(200).json(successResponse(null, RESPONSE_MESSAGES.USER_DELETED));
  } catch (error) {
    logger.error("Delete user error:", error);

    if (error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};
