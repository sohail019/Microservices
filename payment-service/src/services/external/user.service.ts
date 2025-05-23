import axios from "axios";
import { env } from "../../config/env";
import { UserDto } from "../../interfaces/payment.interface";
import { createLogger } from "../../utils/logger";

const logger = createLogger("UserService");
const USER_SERVICE_URL = `${env.userServiceUrl}/api/users`;

/**
 * Get user by ID from user service
 */
export const getUserById = async (userId: string): Promise<UserDto | null> => {
  try {
    logger.debug("Fetching user details", { userId });

    const response = await axios.get(`${USER_SERVICE_URL}/${userId}`);

    if (response.data && response.data.success) {
      logger.debug("User details fetched successfully", { userId });
      return response.data.data;
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
 * Notify user about payment status changes
 */
export const notifyUser = async (
  userId: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    logger.debug("Notifying user about payment", { userId, subject });

    // In a real implementation, you would call a notification service or user service
    // For now, we'll just log it
    logger.info(`Mock notification sent to user: ${userId}`, {
      subject,
      message,
    });

    return true;
  } catch (error) {
    logger.error("Error notifying user:", error);
    return false;
  }
};
