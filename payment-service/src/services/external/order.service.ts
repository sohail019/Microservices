import axios from "axios";
import { env } from "../../config/env";
import { OrderDto } from "../../interfaces/payment.interface";
import { createLogger } from "../../utils/logger";

const logger = createLogger("OrderService");
const ORDER_SERVICE_URL = `${env.orderServiceUrl}/api/orders`;

/**
 * Get order by ID from order service
 */
export const getOrderById = async (
  orderId: string
): Promise<OrderDto | null> => {
  try {
    logger.debug("Fetching order details", { orderId });

    const response = await axios.get(`${ORDER_SERVICE_URL}/${orderId}`);

    if (response.data && response.data.success) {
      logger.debug("Order details fetched successfully", { orderId });
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      logger.warn("Order not found", { orderId });
      return null;
    }

    logger.error("Error fetching order details:", error);
    throw new Error(`Error fetching order details: ${error.message}`);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  comment?: string
): Promise<any> => {
  try {
    logger.debug("Updating order status", { orderId, status });

    const response = await axios.patch(
      `${ORDER_SERVICE_URL}/${orderId}/status`,
      {
        status,
        comment: comment || `Payment status changed to ${status}`,
      }
    );

    if (response.data && response.data.success) {
      logger.info("Order status updated successfully", { orderId, status });
      return response.data.data;
    }

    return null;
  } catch (error) {
    logger.error("Error updating order status:", error);
    throw new Error(`Error updating order status: ${error.message}`);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  orderId: string,
  reason: string
): Promise<any> => {
  try {
    logger.debug("Cancelling order", { orderId, reason });

    const response = await axios.patch(
      `${ORDER_SERVICE_URL}/${orderId}/cancel`,
      {
        reason,
      }
    );

    if (response.data && response.data.success) {
      logger.info("Order cancelled successfully", { orderId });
      return response.data.data;
    }

    return null;
  } catch (error) {
    logger.error("Error cancelling order:", error);
    throw new Error(`Error cancelling order: ${error.message}`);
  }
};
