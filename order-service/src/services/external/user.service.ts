import axios from "axios";
import { env } from "../../config/env";
import { UserDto } from "../../interfaces/order.interface";
import { createLogger } from "../../utils/logger";

const logger = createLogger("UserService");

/**
 * Get user by ID from user service
 */
export const getUserById = async (userId: string): Promise<UserDto | null> => {
  try {
    logger.debug("Fetching user details", { userId });

    const response = await axios.get(
      `${env.userServiceUrl}/api/users/${userId}`
    );

    if (response.data && response.data.success) {
      logger.debug("User details fetched successfully", { userId });
      return response.data.data;
    } else if (response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      logger.warn("User not found", { userId });
      return null;
    }

    logger.error("Error fetching user details:", error);
    throw new Error(`Error fetching user details: ${error.message}`);
  }
};

/**
 * Get user shipping address
 */
export const getUserShippingAddress = async (userId: string): Promise<any> => {
  try {
    logger.debug("Fetching user shipping address", { userId });

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user.address || {};
  } catch (error) {
    logger.error("Error fetching user shipping address:", error);
    throw new Error(`Error fetching user shipping address: ${error.message}`);
  }
};
