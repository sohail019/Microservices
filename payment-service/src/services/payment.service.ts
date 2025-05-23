import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import Payment from "../models/payment.model";
import {
  InitiatePaymentDto,
  WebhookDto,
  RefundPaymentDto,
  PaymentQueryParams,
  PaymentStatus,
  PaymentResponseDto,
  PaymentInitiationResponseDto,
} from "../interfaces/payment.interface";
import {
  PAYMENT_ERRORS,
  PAYMENT_STATUSES,
  PAYMENT_GATEWAYS,
  PAGINATION_DEFAULTS,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
} from "../config/constants";
import { createLogger } from "../utils/logger";
import * as orderService from "./external/order.service";
import * as userService from "./external/user.service";
import { StripeGateway } from "../utils/gateway/stripe.gateway";
import { RazorpayGateway } from "../utils/gateway/razorpay.gateway";
import { BaseGateway } from "../utils/gateway/base.gateway";
import { env } from "../config/env";

const logger = createLogger("PaymentService");

/**
 * Get a payment gateway implementation based on gateway name
 */
const getPaymentGateway = (gateway: string): BaseGateway => {
  switch (gateway) {
    case PAYMENT_GATEWAYS.STRIPE:
      return new StripeGateway({
        apiKey: env.stripe.secretKey,
        apiSecret: env.stripe.webhookSecret,
      });
    case PAYMENT_GATEWAYS.RAZORPAY:
      return new RazorpayGateway({
        apiKey: env.razorpay.keyId,
        apiSecret: env.razorpay.keySecret,
      });
    default:
      throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
};

/**
 * Format payment record for response
 */
const formatPaymentResponse = (payment: any): PaymentResponseDto => {
  return {
    id: payment._id.toString(),
    orderId: payment.orderId,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    paymentType: payment.paymentType,
    gateway: payment.gateway,
    gatewayPaymentId: payment.gatewayPaymentId,
    status: payment.status,
    refundDetails: payment.refundDetails || [],
    metadata: payment.metadata || {},
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

/**
 * Initiate a payment
 */
export const initiatePayment = async (
  userId: string,
  paymentData: InitiatePaymentDto
): Promise<PaymentInitiationResponseDto> => {
  try {
    logger.debug("Initiating payment", {
      userId,
      orderId: paymentData.orderId,
      gateway: paymentData.gateway,
    });

    // Get the order
    const order = await orderService.getOrderById(paymentData.orderId);
    if (!order) {
      throw new Error(PAYMENT_ERRORS.ORDER_NOT_FOUND);
    }

    // Verify the user has permission to pay for this order
    if (order.userId !== userId) {
      logger.warn("User attempting to pay for someone else's order", {
        userId,
        orderId: paymentData.orderId,
      });
      throw new Error(PAYMENT_ERRORS.UNAUTHORIZED);
    }

    // Use order amount if not specified
    const amount = paymentData.amount || order.finalAmount;
    const currency = paymentData.currency || order.currency || "USD";

    // Get the appropriate payment gateway
    const gateway = getPaymentGateway(paymentData.gateway);

    // Create a payment record in our DB
    const payment = new Payment({
      orderId: paymentData.orderId,
      userId,
      amount,
      currency,
      method: paymentData.method,
      paymentType: paymentData.paymentType || "full",
      gateway: paymentData.gateway,
      status: PAYMENT_STATUSES.PENDING,
      metadata: paymentData.metadata || {},
    });

    const savedPayment = await payment.save();

    // Initiate the payment with the gateway
    const gatewayResponse = await gateway.initiatePayment({
      amount,
      currency,
      orderId: paymentData.orderId,
      userId,
      metadata: paymentData.metadata,
      returnUrl: paymentData.returnUrl,
    });

    if (!gatewayResponse.success) {
      // If payment initiation fails, update the payment status
      payment.status = PAYMENT_STATUSES.FAILED as PaymentStatus;
      payment.metadata = {
        ...payment.metadata,
        error: gatewayResponse.message || "Payment initiation failed",
      };
      await payment.save();

      throw new Error(gatewayResponse.message || "Payment initiation failed");
    }

    // Update payment with gateway payment ID
    payment.gatewayPaymentId = gatewayResponse.gatewayPaymentId;
    payment.status = gatewayResponse.status as PaymentStatus;
    payment.gateway_response = gatewayResponse.data;
    await payment.save();

    logger.info("Payment initiated successfully", {
      paymentId: payment._id.toString(),
      gatewayPaymentId: gatewayResponse.gatewayPaymentId,
    });

    // Return response
    return {
      paymentId: payment._id.toString(),
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      redirectUrl: gatewayResponse.redirectUrl,
      gatewayData: gatewayResponse.data,
    };
  } catch (error) {
    logger.error("Error initiating payment", error);
    throw error;
  }
};

/**
 * Process webhook from payment gateway
 */
export const processWebhook = async (webhookData: WebhookDto): Promise<any> => {
  try {
    logger.debug("Processing webhook", {
      event: webhookData.event,
      gateway: webhookData.gateway,
      gatewayPaymentId: webhookData.gatewayPaymentId,
    });

    // Get the payment gateway
    const gateway = getPaymentGateway(webhookData.gateway);

    // Process the webhook
    const gatewayResponse = await gateway.processWebhook({
      event: webhookData.event,
      gatewayPaymentId: webhookData.gatewayPaymentId,
      data: webhookData.data,
    });

    if (!gatewayResponse.success) {
      logger.error("Webhook processing failed", gatewayResponse);
      throw new Error(gatewayResponse.message || "Webhook processing failed");
    }

    // Find the payment by gateway payment ID
    const payment = await Payment.findOne({
      gatewayPaymentId: webhookData.gatewayPaymentId,
    });

    if (!payment) {
      logger.warn("Payment not found for webhook", {
        gatewayPaymentId: webhookData.gatewayPaymentId,
      });
      return {
        message:
          "Payment not found. This may be a duplicate or invalid webhook.",
      };
    }

    // Update payment status
    payment.status = gatewayResponse.status as PaymentStatus;
    payment.gateway_response = {
      ...payment.gateway_response,
      webhook: webhookData,
      response: gatewayResponse.data,
    };

    await payment.save();

    // Handle status-specific actions
    switch (payment.status) {
      case PAYMENT_STATUSES.COMPLETED:
        // Update order status
        await orderService.updateOrderStatus(
          payment.orderId,
          "processing",
          "Payment completed successfully"
        );

        // Notify user
        await userService.notifyUser(
          payment.userId,
          "Payment Successful",
          `Your payment of ${payment.amount} ${payment.currency} for order ${payment.orderId} was successful.`
        );
        break;

      case PAYMENT_STATUSES.FAILED:
        // Update order status
        await orderService.updateOrderStatus(
          payment.orderId,
          "pending",
          "Payment failed. Please try again."
        );

        // Notify user
        await userService.notifyUser(
          payment.userId,
          "Payment Failed",
          `Your payment of ${payment.amount} ${payment.currency} for order ${payment.orderId} failed. Please try again.`
        );
        break;

      case PAYMENT_STATUSES.REFUNDED:
        // Update order status
        await orderService.updateOrderStatus(
          payment.orderId,
          "refunded",
          "Payment has been refunded"
        );

        // Notify user
        await userService.notifyUser(
          payment.userId,
          "Payment Refunded",
          `Your payment of ${payment.amount} ${payment.currency} for order ${payment.orderId} has been refunded.`
        );
        break;
    }

    logger.info("Webhook processed successfully", {
      paymentId: payment._id.toString(),
      newStatus: payment.status,
    });

    return { success: true, message: "Webhook processed successfully" };
  } catch (error) {
    logger.error("Error processing webhook", error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (
  id: string
): Promise<PaymentResponseDto> => {
  try {
    logger.debug("Getting payment by ID", { paymentId: id });

    const payment = await Payment.findById(id);

    if (!payment) {
      throw new Error(PAYMENT_ERRORS.PAYMENT_NOT_FOUND);
    }

    logger.info("Payment retrieved successfully", { paymentId: id });

    return formatPaymentResponse(payment);
  } catch (error) {
    logger.error("Error getting payment", error);
    throw error;
  }
};

/**
 * Get payments by order ID
 */
export const getPaymentsByOrderId = async (
  orderId: string
): Promise<PaymentResponseDto[]> => {
  try {
    logger.debug("Getting payments by order ID", { orderId });

    const payments = await Payment.find({ orderId }).sort({ createdAt: -1 });

    logger.info("Payments retrieved successfully", {
      orderId,
      count: payments.length,
    });

    return payments.map(formatPaymentResponse);
  } catch (error) {
    logger.error("Error getting payments by order ID", error);
    throw error;
  }
};

/**
 * Get payments by user ID with pagination and filters
 */
export const getPaymentsByUserId = async (
  userId: string,
  query: PaymentQueryParams = {}
): Promise<any> => {
  try {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
      status,
      method,
      gateway,
      startDate,
      endDate,
    } = query;

    logger.debug("Getting payments by user ID", {
      userId,
      page,
      limit,
      sort,
      status,
    });

    const filter: any = { userId };

    // Apply filters
    if (status) {
      filter.status = status;
    }
    if (method) {
      filter.method = method;
    }
    if (gateway) {
      filter.gateway = gateway;
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

    const payments = await Payment.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    logger.info("Payments retrieved successfully", {
      userId,
      count: payments.length,
      total,
    });

    return {
      payments: payments.map(formatPaymentResponse),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error getting payments by user ID", error);
    throw error;
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (
  id: string,
  refundData: RefundPaymentDto
): Promise<PaymentResponseDto> => {
  try {
    logger.debug("Refunding payment", {
      paymentId: id,
      amount: refundData.amount,
    });

    const payment = await Payment.findById(id);

    if (!payment) {
      throw new Error(PAYMENT_ERRORS.PAYMENT_NOT_FOUND);
    }

    // Verify payment can be refunded
    if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    // Get the refund amount
    const refundAmount = refundData.amount || payment.amount;

    // Check if refund amount is valid
    if (refundAmount <= 0 || refundAmount > payment.amount) {
      throw new Error("Invalid refund amount");
    }

    // Get the payment gateway
    const gateway = getPaymentGateway(payment.gateway);

    // Process the refund
    const gatewayResponse = await gateway.processRefund({
      paymentId: payment.gatewayPaymentId,
      amount: refundAmount,
      reason: refundData.reason,
    });

    if (!gatewayResponse.success) {
      throw new Error(gatewayResponse.message || "Refund failed");
    }

    // Update payment status
    const isFullRefund = refundAmount === payment.amount;
    payment.status = isFullRefund
      ? (PAYMENT_STATUSES.REFUNDED as PaymentStatus)
      : (PAYMENT_STATUSES.PARTIALLY_REFUNDED as PaymentStatus);

    // Add refund details
    payment.refundDetails = payment.refundDetails || [];
    payment.refundDetails.push({
      amount: refundAmount,
      reason: refundData.reason,
      reference: gatewayResponse.data?.refundId || `refund_${Date.now()}`,
      createdAt: new Date(),
    });

    payment.gateway_response = {
      ...payment.gateway_response,
      refund: gatewayResponse.data,
    };

    await payment.save();

    // Update order status
    if (isFullRefund) {
      await orderService.updateOrderStatus(
        payment.orderId,
        "refunded",
        `Payment refunded: ${refundData.reason}`
      );
    }

    logger.info("Payment refunded successfully", {
      paymentId: id,
      amount: refundAmount,
      isFullRefund,
    });

    return formatPaymentResponse(payment);
  } catch (error) {
    logger.error("Error refunding payment", error);
    throw error;
  }
};

/**
 * Abort/Cancel payment
 */
export const abortPayment = async (id: string): Promise<PaymentResponseDto> => {
  try {
    logger.debug("Aborting payment", { paymentId: id });

    const payment = await Payment.findById(id);

    if (!payment) {
      throw new Error(PAYMENT_ERRORS.PAYMENT_NOT_FOUND);
    }

    // Verify payment can be cancelled
    if (
      ![PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING].includes(
        payment.status as PaymentStatus
      )
    ) {
      throw new Error(`Cannot cancel payment with status: ${payment.status}`);
    }

    // Get the payment gateway
    const gateway = getPaymentGateway(payment.gateway);

    // Cancel the payment
    const gatewayResponse = await gateway.cancelPayment(
      payment.gatewayPaymentId
    );

    // Update payment status
    payment.status = PAYMENT_STATUSES.CANCELLED as PaymentStatus;
    payment.gateway_response = {
      ...payment.gateway_response,
      cancellation: gatewayResponse.data,
    };

    await payment.save();

    // Continuing from abortPayment function in payment.service.ts
    // Update order status
    await orderService.updateOrderStatus(
      payment.orderId,
      "pending",
      "Payment was cancelled"
    );

    logger.info("Payment aborted successfully", { paymentId: id });

    return formatPaymentResponse(payment);
  } catch (error) {
    logger.error("Error aborting payment", error);
    throw error;
  }
};

/**
 * Seed payments for testing
 */
export const seedPayments = async (
  count: number = 10
): Promise<{ count: number }> => {
  try {
    logger.debug(`Seeding ${count} payments`);

    const payments = [];
    const gateways = Object.values(PAYMENT_GATEWAYS);
    const statuses = Object.values(PAYMENT_STATUSES);
    const methods = Object.values(PAYMENT_METHODS);
    const types = Object.values(PAYMENT_TYPES);

    for (let i = 0; i < count; i++) {
      const userId = `user_${faker.string.uuid()}`;
      const orderId = `order_${faker.string.uuid()}`;

      const status = faker.helpers.arrayElement(statuses);
      const isRefunded = [
        PAYMENT_STATUSES.REFUNDED,
        PAYMENT_STATUSES.PARTIALLY_REFUNDED,
      ].includes(status as PaymentStatus);

      const payment = new Payment({
        orderId,
        userId,
        amount: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
        currency: faker.helpers.arrayElement(["USD", "EUR", "GBP", "INR"]),
        method: faker.helpers.arrayElement(methods),
        paymentType: faker.helpers.arrayElement(types),
        gateway: faker.helpers.arrayElement(gateways),
        gatewayPaymentId: `pi_${faker.string.alphanumeric(24)}`,
        status,
        metadata: {
          browser: faker.internet.userAgent(),
          ipAddress: faker.internet.ip(),
          deviceType: faker.helpers.arrayElement([
            "desktop",
            "mobile",
            "tablet",
          ]),
        },
        refundDetails: isRefunded
          ? [
              {
                amount: faker.number.float({
                  min: 5,
                  max: 500,
                  precision: 0.01,
                }),
                reason: faker.helpers.arrayElement([
                  "Customer requested",
                  "Item out of stock",
                  "Shipping delay",
                  "Product damaged",
                  "Order mistake",
                ]),
                reference: `ref_${faker.string.alphanumeric(16)}`,
                createdAt: faker.date.recent(),
              },
            ]
          : [],
        createdAt: faker.date.recent({ days: 30 }),
        updatedAt: faker.date.recent(),
      });

      payments.push(payment);
    }

    await Payment.insertMany(payments);

    logger.info(`Successfully seeded ${count} payments`);

    return { count };
  } catch (error) {
    logger.error("Error seeding payments", error);
    throw error;
  }
};
