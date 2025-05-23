import { Request, Response } from "express";
import * as orderService from "../services/order.service";
import { RESPONSE_MESSAGES } from "../config/constants";
import { successResponse, errorResponse } from "../utils/response";
import { createLogger } from "../utils/logger";

const logger = createLogger("OrderController");

/**
 * Create a new order
 */
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // Add userId to order data
    const orderData = {
      ...req.body,
      userId,
    };

    const order = await orderService.createOrder(orderData);
    res
      .status(201)
      .json(successResponse(order, RESPONSE_MESSAGES.ORDER_CREATED));
  } catch (error) {
    logger.error("Create order error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse query parameters
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      sort: req.query.sort as string,
    };

    const orders = await orderService.getAllOrders(query as any);
    if (!orders) {
      res.status(404).json(errorResponse("No orders found"));
      return;
    }
    res.status(200).json(successResponse(orders));
  } catch (error) {
    logger.error("Get all orders error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get orders by user ID (admin only)
 */
export const getOrdersByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Parse query parameters
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      sort: req.query.sort as string,
    };

    const orders = await orderService.getOrdersByUserId(userId, query as any);
    res.status(200).json(successResponse(orders));
  } catch (error) {
    logger.error("Get orders by user ID error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get user's own orders
 */
export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // Parse query parameters
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      sort: req.query.sort as string,
    };

    const orders = await orderService.getOrdersByUserId(userId, query as any);
    res.status(200).json(successResponse(orders));
  } catch (error) {
    logger.error("Get my orders error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // Add userId to status data
    const statusData = {
      ...req.body,
      userId,
    };

    const order = await orderService.updateOrderStatus(id, statusData);
    res
      .status(200)
      .json(successResponse(order, RESPONSE_MESSAGES.ORDER_UPDATED));
  } catch (error) {
    logger.error("Update order status error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const { reason } = req.body;
    const order = await orderService.cancelOrder(id, userId, reason);
    res
      .status(200)
      .json(successResponse(order, RESPONSE_MESSAGES.ORDER_CANCELLED));
  } catch (error) {
    logger.error("Cancel order error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Cancel order item
 */
export const cancelOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const { reason } = req.body;
    const order = await orderService.cancelOrderItem(
      id,
      itemId,
      userId,
      reason
    );
    res
      .status(200)
      .json(successResponse(order, RESPONSE_MESSAGES.ORDER_ITEM_CANCELLED));
  } catch (error) {
    logger.error("Cancel order item error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get order status log
 */
export const getOrderStatusLog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const statusLog = await orderService.getOrderStatusLog(id);
    res.status(200).json(successResponse(statusLog));
  } catch (error) {
    logger.error("Get order status log error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Apply discount to order
 */
export const applyOrderDiscount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await orderService.applyDiscount(id, req.body);
    res
      .status(200)
      .json(successResponse(order, RESPONSE_MESSAGES.DISCOUNT_APPLIED));
  } catch (error) {
    logger.error("Apply discount error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get order items
 */
export const getOrderItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const items = await orderService.getOrderItems(id);
    res.status(200).json(successResponse(items));
  } catch (error) {
    logger.error("Get order items error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Update order item
 */
export const updateOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId, itemId } = req.params;
    const order = await orderService.updateOrderItem(orderId, itemId, req.body);
    res
      .status(200)
      .json(successResponse(order, RESPONSE_MESSAGES.ORDER_ITEM_UPDATED));
  } catch (error) {
    logger.error("Update order item error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Delete order item
 */
export const deleteOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId, itemId } = req.params;
    const order = await orderService.deleteOrderItem(orderId, itemId);
    res
      .status(200)
      .json(successResponse(order, RESPONSE_MESSAGES.ORDER_ITEM_DELETED));
  } catch (error) {
    logger.error("Delete order item error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get order details with items and payments
 */
export const getOrderDetailWithItemsAndPaymentsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const orderDetails = await orderService.getOrderDetailWithItemsAndPayments(
      orderId
    );
    res.status(200).json(successResponse(orderDetails));
  } catch (error) {
    logger.error("Get order details error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get order details with shipping address
 */
export const getOrderDetailsWithShippingAddressController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const orderDetails = await orderService.getOrderDetailsWithShippingAddress(
      orderId
    );
    res.status(200).json(successResponse(orderDetails));
  } catch (error) {
    logger.error("Get order details with shipping error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Seed orders (for testing)
 */
export const seedOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = req.body.count || 10;
    await orderService.seedOrders(count);
    res
      .status(200)
      .json(successResponse({ count }, RESPONSE_MESSAGES.ORDERS_SEEDED));
  } catch (error) {
    logger.error("Seed orders error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};
