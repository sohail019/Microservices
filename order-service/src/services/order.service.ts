import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Order, OrderItem } from "../models/order.model";
import { OrderStatusLog } from "../models/orderStatusLog.model";
import {
  CreateOrderDto,
  OrderQueryParams,
  UpdateOrderStatusDto,
  UpdateOrderItemDto,
  ApplyDiscountDto,
  OrderStatus,
} from "../interfaces/order.interface";
import {
  ORDER_ERRORS,
  ORDER_STATUSES,
  PAGINATION_DEFAULTS,
} from "../config/constants";
import { createLogger } from "../utils/logger";
import * as productService from "./external/product.service";
import * as userService from "./external/user.service";
import {
  formatOrderItemResponse,
  formatOrderResponse,
} from "../helper/order.helper";

const logger = createLogger("OrderService");

/**
 * Create a new order
 */
export const createOrder = async (orderData: CreateOrderDto): Promise<any> => {
  try {
    logger.debug("Creating new order", { userId: orderData.userId });

    let items = [];
    let totalAmount = 0;
    let gstAmount = 0;

    // If cartId is provided, get cart items (mock implementation)
    if (orderData.cartId) {
      // Mock implementation - in real world would call cart service
      const mockCartItems = [
        {
          productId: "mockProductId",
          quantity: 2,
        },
      ];

      // Process each cart item
      for (const item of mockCartItems) {
        const product = await productService.getProductById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (!product.isAvailable || product.availableStock < item.quantity) {
          throw new Error(
            `Product ${product.name} is not available in the requested quantity`
          );
        }

        const gstRate = 0.18; // Assuming 18% GST
        const itemGst = product.price * gstRate;
        const itemTotal = product.price * item.quantity;

        totalAmount += itemTotal;
        gstAmount += itemGst * item.quantity;

        // Add to items array
        items.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          discountAmount: product.discountAmount || 0,
          discountType: product.discountType || "fixed",
          gstAmount: itemGst,
        });
      }
    }
    // If items array is provided directly
    else if (orderData.items && orderData.items.length > 0) {
      // Process each item
      for (const item of orderData.items) {
        const product = await productService.getProductById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (!product.isAvailable || product.availableStock < item.quantity) {
          throw new Error(
            `Product ${product.name} is not available in the requested quantity`
          );
        }

        const gstRate = 0.18; // Assuming 18% GST
        const itemGst = product.price * gstRate;
        const itemTotal = product.price * item.quantity;

        totalAmount += itemTotal;
        gstAmount += itemGst * item.quantity;

        // Add to items array
        items.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          discountAmount: product.discountAmount || 0,
          discountType: product.discountType || "fixed",
          gstAmount: itemGst,
        });
      }
    } else {
      throw new Error("Either cartId or items array is required");
    }

    // Calculate discount
    let discountAmount = orderData.discountAmount || 0;
    let finalAmount = totalAmount;

    if (discountAmount > 0) {
      if (orderData.discountType === "percentage") {
        discountAmount = (totalAmount * discountAmount) / 100;
      }
      finalAmount = totalAmount - discountAmount;
    }

    // Add GST to final amount
    finalAmount += gstAmount;

    // Create order
    const order = new Order({
      userId: orderData.userId,
      status: ORDER_STATUSES.PENDING,
      totalAmount,
      discountAmount,
      discountType: orderData.discountType || "fixed",
      gstNumber: orderData.gstNumber || "",
      gstAmount,
      finalAmount,
      currency: orderData.currency || "USD",
    });

    const savedOrder = await order.save();

    // Create order items
    const orderItems = items.map((item) => ({
      orderId: savedOrder._id,
      ...item,
      status: ORDER_STATUSES.PENDING,
    }));

    await OrderItem.insertMany(orderItems);

    // Create initial status log
    await OrderStatusLog.create({
      orderId: savedOrder._id,
      status: ORDER_STATUSES.PENDING,
      timestamp: new Date(),
      comment: "Order created",
      userId: orderData.userId,
    });

    // Decrease product stock
    for (const item of items) {
      await productService.decreaseProductStock(item.productId, item.quantity);
    }

    logger.info("Order created successfully", { orderId: savedOrder._id });

    // Return full order with items and status log
    return await getOrderById(savedOrder._id.toString());
  } catch (error) {
    logger.error("Error creating order:", error);
    throw error;
  }
};

/**
 * Get all orders with pagination and filters
 */
export const getAllOrders = async (
  query: OrderQueryParams = {}
): Promise<any> => {
  try {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
      status,
      startDate,
      endDate,
    } = query;

    logger.debug("Fetching all orders", { page, limit, sort, status });

    const filter: any = {};

    // Apply filters
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = startDate;
      }
      if (endDate) {
        filter.createdAt.$lte = endDate;
      }
    }

    // Determine sort direction and field
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

    const orders = await Order.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination info
    const total = await Order.countDocuments(filter);

    // Return formatted response
    const formattedOrders = orders.map((order) => formatOrderResponse(order));

    logger.info("Orders fetched successfully", { count: orders.length, total });

    return {
      orders: formattedOrders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching all orders:", error);
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string): Promise<any> => {
  try {
    logger.debug("Fetching order by ID", { orderId: id });

    const order = await Order.findById(id).lean();

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Get order items
    const orderItems = await OrderItem.find({ orderId: order._id }).lean();

    // Get status log
    const statusLog = await OrderStatusLog.find({ orderId: order._id })
      .sort({ timestamp: 1 })
      .lean();

    // Format response
    const formattedOrder = {
      ...formatOrderResponse(order),
      items: orderItems.map((item) => formatOrderItemResponse(item)),
      statusLog: statusLog.map((log) => ({
        status: log.status,
        timestamp: log.timestamp,
        comment: log.comment,
      })),
    };

    logger.info("Order fetched successfully", { orderId: id });

    return formattedOrder;
  } catch (error) {
    logger.error("Error fetching order by ID:", error);
    throw error;
  }
};

/**
 * Get orders by user ID
 */
export const getOrdersByUserId = async (
  userId: string,
  query: OrderQueryParams = {}
): Promise<any> => {
  try {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
      status,
    } = query;

    logger.debug("Fetching orders by user ID", {
      userId,
      page,
      limit,
      sort,
      status,
    });

    const filter: any = { userId };

    // Apply status filter if provided
    if (status) {
      filter.status = status;
    }

    // Determine sort direction and field
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

    const orders = await Order.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination info
    const total = await Order.countDocuments(filter);

    // Return formatted response
    const formattedOrders = orders.map((order) => formatOrderResponse(order));

    logger.info("User orders fetched successfully", {
      userId,
      count: orders.length,
      total,
    });

    return {
      orders: formattedOrders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching orders by user ID:", error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string,
  statusData: UpdateOrderStatusDto
): Promise<any> => {
  try {
    logger.debug("Updating order status", {
      orderId: id,
      status: statusData.status,
    });

    const order = await Order.findById(id);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Cannot change status of a cancelled order except to refunded
    if (
      order.status === ORDER_STATUSES.CANCELLED &&
      statusData.status !== ORDER_STATUSES.REFUNDED
    ) {
      throw new Error("Cannot change status of a cancelled order");
    }

    // Update order status
    order.status = statusData.status;
    await order.save();

    // Create status log entry
    await OrderStatusLog.create({
      orderId: order._id,
      status: statusData.status,
      timestamp: new Date(),
      comment: statusData.comment || `Status updated to ${statusData.status}`,
      userId: statusData.userId,
    });

    // Update order items status
    await OrderItem.updateMany(
      { orderId: order._id },
      { status: statusData.status }
    );

    logger.info("Order status updated successfully", {
      orderId: id,
      status: statusData.status,
    });

    return await getOrderById(id);
  } catch (error) {
    logger.error("Error updating order status:", error);
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  id: string,
  userId: string,
  reason: string = "Cancelled by user"
): Promise<any> => {
  try {
    logger.debug("Cancelling order", { orderId: id, userId });

    const order = await Order.findById(id);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Can only cancel pending or processing orders
    if (
      ![ORDER_STATUSES.PENDING, ORDER_STATUSES.PROCESSING].includes(
        order.status as OrderStatus
      )
    ) {
      throw new Error(ORDER_ERRORS.CANNOT_CANCEL_ORDER);
    }

    // Update order status
    order.status = ORDER_STATUSES.CANCELLED as OrderStatus;
    await order.save();

    // Create status log entry
    await OrderStatusLog.create({
      orderId: order._id,
      status: ORDER_STATUSES.CANCELLED,
      timestamp: new Date(),
      comment: reason,
      userId,
    });

    // Update order items status
    await OrderItem.updateMany(
      { orderId: order._id },
      { status: ORDER_STATUSES.CANCELLED }
    );

    // Restore product stock
    const orderItems = await OrderItem.find({ orderId: order._id });
    for (const item of orderItems) {
      await productService.increaseProductStock(item.productId, item.quantity);
    }

    logger.info("Order cancelled successfully", { orderId: id });

    return await getOrderById(id);
  } catch (error) {
    logger.error("Error cancelling order:", error);
    throw error;
  }
};

/**
 * Cancel order item
 */
export const cancelOrderItem = async (
  orderId: string,
  itemId: string,
  userId: string,
  reason: string = "Item cancelled by user"
): Promise<any> => {
  try {
    logger.debug("Cancelling order item", { orderId, itemId, userId });

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Can only cancel items in pending or processing orders
    if (
      ![ORDER_STATUSES.PENDING, ORDER_STATUSES.PROCESSING].includes(
        order.status as OrderStatus
      )
    ) {
      throw new Error("Cannot cancel items in order with current status");
    }

    const orderItem = await OrderItem.findOne({
      _id: new mongoose.Types.ObjectId(itemId),
      orderId: order._id,
    });

    if (!orderItem) {
      throw new Error(ORDER_ERRORS.ORDER_ITEM_NOT_FOUND);
    }

    // Skip if already cancelled
    if (orderItem.status === ORDER_STATUSES.CANCELLED) {
      return await getOrderById(orderId);
    }

    // Calculate refund amount
    const itemTotal = orderItem.unitPrice * orderItem.quantity;
    const itemDiscount =
      orderItem.discountType === "percentage"
        ? itemTotal * (orderItem.discountAmount / 100)
        : orderItem.discountAmount;
    const refundAmount =
      itemTotal - itemDiscount + orderItem.gstAmount * orderItem.quantity;

    // Update order amounts
    order.totalAmount -= itemTotal;
    order.gstAmount -= orderItem.gstAmount * orderItem.quantity;

    // Recalculate discount if percentage
    if (order.discountType === "percentage") {
      order.discountAmount =
        (order.totalAmount * Number(order.discountAmount)) / 100;
    }

    // Recalculate final amount
    order.finalAmount =
      order.totalAmount - order.discountAmount + order.gstAmount;

    // Add to status log
    await OrderStatusLog.create({
      orderId: order._id,
      status: order.status,
      timestamp: new Date(),
      comment: `Item cancelled: ${reason}`,
      userId,
    });

    // If all items are cancelled, cancel the order
    const remainingItems = await OrderItem.find({
      orderId: order._id,
      status: { $ne: ORDER_STATUSES.CANCELLED },
      _id: { $ne: orderItem._id },
    });

    if (remainingItems.length === 0) {
      order.status = ORDER_STATUSES.CANCELLED as OrderStatus;
      await OrderStatusLog.create({
        orderId: order._id,
        status: ORDER_STATUSES.CANCELLED,
        timestamp: new Date(),
        comment: "All items cancelled, order automatically cancelled",
        userId,
      });
    }

    await order.save();

    // Update item status
    orderItem.status = ORDER_STATUSES.CANCELLED as OrderStatus;
    await orderItem.save();

    // Restore product stock
    await productService.increaseProductStock(
      orderItem.productId,
      orderItem.quantity
    );

    logger.info("Order item cancelled successfully", { orderId, itemId });

    return await getOrderById(orderId);
  } catch (error) {
    logger.error("Error cancelling order item:", error);
    throw error;
  }
};

/**
 * Get order status log
 */
export const getOrderStatusLog = async (orderId: string): Promise<any> => {
  try {
    logger.debug("Fetching order status log", { orderId });

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    const statusLog = await OrderStatusLog.find({ orderId: order._id })
      .sort({ timestamp: 1 })
      .lean();

    logger.info("Order status log fetched successfully", {
      orderId,
      count: statusLog.length,
    });

    return statusLog.map((log) => ({
      status: log.status,
      timestamp: log.timestamp,
      comment: log.comment,
      userId: log.userId,
    }));
  } catch (error) {
    logger.error("Error fetching order status log:", error);
    throw error;
  }
};

/**
 * Apply discount to order
 */
export const applyDiscount = async (
  id: string,
  discountData: ApplyDiscountDto
): Promise<any> => {
  try {
    logger.debug("Applying discount to order", {
      orderId: id,
      amount: discountData.discountAmount,
      type: discountData.discountType,
    });

    const order = await Order.findById(id);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Can only modify pending orders
    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new Error("Can only apply discount to pending orders");
    }

    // Calculate discount amount
    let discountAmount = discountData.discountAmount;
    if (discountData.discountType === "percentage") {
      discountAmount = (order.totalAmount * discountAmount) / 100;

      // Prevent discount greater than order amount
      if (discountAmount > order.totalAmount) {
        discountAmount = order.totalAmount;
      }
    } else {
      // Prevent discount greater than order amount
      if (discountAmount > order.totalAmount) {
        throw new Error("Discount amount cannot be greater than order total");
      }
    }

    // Update order
    order.discountAmount =
      discountData.discountType === "percentage"
        ? discountData.discountAmount // Store percentage for percentage type
        : discountAmount;
    order.discountType = discountData.discountType;

    // Recalculate final amount
    const actualDiscountAmount =
      discountData.discountType === "percentage"
        ? (order.totalAmount * discountData.discountAmount) / 100
        : discountAmount;

    order.finalAmount =
      order.totalAmount - actualDiscountAmount + order.gstAmount;

    // Add to status log
    await OrderStatusLog.create({
      orderId: order._id,
      status: order.status,
      timestamp: new Date(),
      comment: `Discount applied: ${discountData.discountAmount}${
        discountData.discountType === "percentage" ? "%" : " " + order.currency
      }`,
    });

    await order.save();

    logger.info("Discount applied to order successfully", { orderId: id });

    return await getOrderById(id);
  } catch (error) {
    logger.error("Error applying discount to order:", error);
    throw error;
  }
};

/**
 * Get order items
 */
export const getOrderItems = async (orderId: string): Promise<any> => {
  try {
    logger.debug("Fetching order items", { orderId });

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    const orderItems = await OrderItem.find({ orderId: order._id }).lean();

    logger.info("Order items fetched successfully", {
      orderId,
      count: orderItems.length,
    });

    return orderItems.map((item) => formatOrderItemResponse(item));
  } catch (error) {
    logger.error("Error fetching order items:", error);
    throw error;
  }
};

/**
 * Update order item
 */
export const updateOrderItem = async (
  orderId: string,
  itemId: string,
  updateData: UpdateOrderItemDto
): Promise<any> => {
  try {
    logger.debug("Updating order item", { orderId, itemId, updateData });

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Can only modify pending orders
    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new Error("Can only update items in pending orders");
    }

    const orderItem = await OrderItem.findOne({
      _id: new mongoose.Types.ObjectId(itemId),
      orderId: order._id,
    });

    if (!orderItem) {
      throw new Error(ORDER_ERRORS.ORDER_ITEM_NOT_FOUND);
    }

    // Calculate original amount for this item
    const originalItemTotal = orderItem.unitPrice * orderItem.quantity;
    const originalItemGst = orderItem.gstAmount * orderItem.quantity;

    // Update quantity if provided
    if (updateData.quantity !== undefined) {
      // Validate quantity
      if (updateData.quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }

      // Check product stock
      const product = await productService.getProductById(orderItem.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const additionalQuantity = updateData.quantity - orderItem.quantity;

      if (additionalQuantity > 0) {
        if (
          !product.isAvailable ||
          product.availableStock < additionalQuantity
        ) {
          throw new Error(ORDER_ERRORS.PRODUCT_NOT_AVAILABLE);
        }

        // Decrease stock for additional quantity
        await productService.decreaseProductStock(
          orderItem.productId,
          additionalQuantity
        );
      } else if (additionalQuantity < 0) {
        // Increase stock for reduced quantity
        await productService.increaseProductStock(
          orderItem.productId,
          Math.abs(additionalQuantity)
        );
      }

      orderItem.quantity = updateData.quantity;
    }

    // Update status if provided
    if (updateData.status) {
      orderItem.status = updateData.status;
    }

    await orderItem.save();

    // Recalculate order totals
    const newItemTotal = orderItem.unitPrice * orderItem.quantity;
    const newItemGst = orderItem.gstAmount * orderItem.quantity;

    // Update order amounts
    order.totalAmount = order.totalAmount - originalItemTotal + newItemTotal;
    order.gstAmount = order.gstAmount - originalItemGst + newItemGst;

    // Recalculate discount if percentage
    if (order.discountType === "percentage") {
      order.discountAmount =
        (order.totalAmount * Number(order.discountAmount)) / 100;
    }

    // Recalculate final amount
    const actualDiscountAmount =
      order.discountType === "percentage"
        ? (order.totalAmount * Number(order.discountAmount)) / 100
        : order.discountAmount;

    order.finalAmount =
      order.totalAmount - actualDiscountAmount + order.gstAmount;

    await order.save();

    // Create log entry
    await OrderStatusLog.create({
      orderId: order._id,
      status: order.status,
      timestamp: new Date(),
      comment: `Order item updated: ${itemId}`,
    });

    logger.info("Order item updated successfully", { orderId, itemId });

    return await getOrderById(orderId);
  } catch (error) {
    logger.error("Error updating order item:", error);
    throw error;
  }
};

/**
 * Delete order item
 */
export const deleteOrderItem = async (
  orderId: string,
  itemId: string
): Promise<any> => {
  try {
    logger.debug("Deleting order item", { orderId, itemId });

    // This is essentially the same as cancelling an item
    return await cancelOrderItem(
      orderId,
      itemId,
      "system",
      "Item removed from order"
    );
  } catch (error) {
    logger.error("Error deleting order item:", error);
    throw error;
  }
};

/**
 * Get order details with items and payments
 */
export const getOrderDetailWithItemsAndPayments = async (
  orderId: string
): Promise<any> => {
  try {
    logger.debug("Fetching order details with items and payments", { orderId });

    // Fetch order with items
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Mock payment details (in a real implementation, would fetch from payment service)
    const mockPayments = [
      {
        id: faker.string.uuid(),
        orderId: order.id,
        amount: order.finalAmount,
        status: "completed",
        method: "credit_card",
        createdAt: new Date(),
      },
    ];

    logger.info("Order details with items and payments fetched successfully", {
      orderId,
    });

    return {
      order,
      payments: mockPayments,
    };
  } catch (error) {
    logger.error(
      "Error fetching order details with items and payments:",
      error
    );
    throw error;
  }
};

/**
 * Get order details with shipping address
 */
export const getOrderDetailsWithShippingAddress = async (
  orderId: string
): Promise<any> => {
  try {
    logger.debug("Fetching order details with shipping address", { orderId });

    // Fetch order
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Error(ORDER_ERRORS.ORDER_NOT_FOUND);
    }

    // Fetch user details (shipping address)
    const shippingAddress = await userService.getUserShippingAddress(
      order.userId
    );

    logger.info("Order details with shipping address fetched successfully", {
      orderId,
    });

    return {
      order,
      shippingAddress,
    };
  } catch (error) {
    logger.error("Error fetching order details with shipping address:", error);
    throw error;
  }
};

/**
 * Seed orders for demo/testing
 */
export const seedOrders = async (count: number = 10): Promise<void> => {
  try {
    logger.debug("Seeding orders", { count });

    const users = ["user1", "user2", "user3", "user4", "user5"];
    const products = [
      { id: "product1", name: "Laptop", price: 1299.99 },
      { id: "product2", name: "Smartphone", price: 899.99 },
      { id: "product3", name: "Headphones", price: 199.99 },
      { id: "product4", name: "Tablet", price: 499.99 },
      { id: "product5", name: "Smartwatch", price: 299.99 },
    ];

    for (let i = 0; i < count; i++) {
      // Create order
      const userId = users[Math.floor(Math.random() * users.length)];
      const numItems = Math.floor(Math.random() * 4) + 1; // 1 to 5 items per order

      // Create order object
      const order = new Order({
        userId,
        status: faker.helpers.arrayElement(Object.values(ORDER_STATUSES)),
        totalAmount: 0,
        discountAmount: 0,
        discountType: faker.helpers.arrayElement(["percentage", "fixed"]),
        gstNumber: faker.string.alphanumeric(10).toUpperCase(),
        gstAmount: 0,
        finalAmount: 0,
        currency: "USD",
      });

      await order.save();

      // Create status log
      await OrderStatusLog.create({
        orderId: order._id,
        status: order.status,
        timestamp: faker.date.recent(),
        comment: "Order created",
        userId,
      });

      // Add random items to order
      let totalAmount = 0;
      let gstAmount = 0;

      const orderItems = [];
      const selectedProducts = new Set();

      for (let j = 0; j < numItems; j++) {
        // Select a random product
        let product;
        do {
          product = products[Math.floor(Math.random() * products.length)];
        } while (selectedProducts.has(product.id));

        selectedProducts.add(product.id);

        // Random quantity between 1 and 3
        const quantity = Math.floor(Math.random() * 3) + 1;

        // Calculate costs
        const gstRate = 0.18; // Assuming 18% GST
        const itemGst = product.price * gstRate;
        const itemTotal = product.price * quantity;

        totalAmount += itemTotal;
        gstAmount += itemGst * quantity;

        // Create order item
        const orderItem = {
          orderId: order._id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          discountAmount: 0,
          discountType: "fixed",
          gstAmount: itemGst,
          status: order.status,
        };

        orderItems.push(orderItem);
      }

      // Apply discount (50% of orders get a discount)
      let discountAmount = 0;
      if (Math.random() > 0.5) {
        if (order.discountType === "percentage") {
          const percentage = Math.floor(Math.random() * 20) + 5; // 5% to 25%
          order.discountAmount = percentage;
          discountAmount = (totalAmount * percentage) / 100;
        } else {
          discountAmount = Math.floor(Math.random() * (totalAmount * 0.3)); // Up to 30% of total as fixed amount
          order.discountAmount = discountAmount;
        }
      }

      // Update order with correct amounts
      order.totalAmount = totalAmount;
      order.gstAmount = gstAmount;
      order.finalAmount = totalAmount + gstAmount - discountAmount;

      await order.save();
      await OrderItem.insertMany(orderItems);
      await OrderStatusLog.create({
        orderId: order._id,
        status: order.status,
        timestamp: new Date(),
        comment: "Order seeded" + i,
        userId,
      });
    }
    logger.info("Orders seeded successfully", { count });
  } catch (error) {
    logger.error("Error seeding orders:", error);
    throw error;
  }
};
