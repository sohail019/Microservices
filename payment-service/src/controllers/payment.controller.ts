import { Request, Response } from "express";
import * as paymentService from "../services/payment.service";
import { RESPONSE_MESSAGES, PAYMENT_ERRORS } from "../config/constants";
import { successResponse, errorResponse } from "../utils/response";
import { createLogger } from "../utils/logger";
import {
  InitiatePaymentDto,
  RefundPaymentDto,
  WebhookDto,
} from "../interfaces/payment.interface";

const logger = createLogger("PaymentController");

/**
 * Initiate a payment
 */
export const initiatePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const paymentData: InitiatePaymentDto = req.body;
    const result = await paymentService.initiatePayment(userId, paymentData);

    res
      .status(200)
      .json(successResponse(result, RESPONSE_MESSAGES.PAYMENT_INITIATED));
  } catch (error) {
    logger.error("Error initiating payment:", error);

    if (error.message === PAYMENT_ERRORS.ORDER_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else if (error.message === PAYMENT_ERRORS.UNAUTHORIZED) {
      res.status(403).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Handle webhook from payment gateway
 */
export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const webhookData: WebhookDto = req.body;

    // Note: Webhooks don't require authentication as they come from payment gateways
    const result = await paymentService.processWebhook(webhookData);

    res
      .status(200)
      .json(successResponse(result, RESPONSE_MESSAGES.WEBHOOK_PROCESSED));
  } catch (error) {
    logger.error("Error processing webhook:", error);

    // Always return 200 to webhook provider to prevent retries
    // but include the error information
    res.status(200).json(errorResponse(error.message));
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    res.status(200).json(successResponse(payment));
  } catch (error) {
    logger.error("Error getting payment:", error);

    if (error.message === PAYMENT_ERRORS.PAYMENT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Get payments by order ID
 */
export const getPaymentsByOrderId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const payments = await paymentService.getPaymentsByOrderId(orderId);

    res.status(200).json(successResponse(payments));
  } catch (error) {
    logger.error("Error getting payments by order ID:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get payments by user ID
 */
export const getPaymentsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Parse query parameters
    const query = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as string,
      method: req.query.method as string,
      gateway: req.query.gateway as string,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      sort: req.query.sort as string,
    };

    const result = await paymentService.getPaymentsByUserId(
      userId,
      query as any
    );

    res.status(200).json(successResponse(result));
  } catch (error) {
    logger.error("Error getting payments by user ID:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get current user's payments
 */
export const getMyPayments = async (
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
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as string,
      method: req.query.method as string,
      gateway: req.query.gateway as string,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      sort: req.query.sort as string,
    };

    const result = await paymentService.getPaymentsByUserId(
      userId,
      query as any
    );

    res.status(200).json(successResponse(result));
  } catch (error) {
    logger.error("Error getting user payments:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const refundData: RefundPaymentDto = req.body;

    const payment = await paymentService.refundPayment(id, refundData);

    res
      .status(200)
      .json(successResponse(payment, RESPONSE_MESSAGES.PAYMENT_REFUNDED));
  } catch (error) {
    logger.error("Error refunding payment:", error);

    if (error.message === PAYMENT_ERRORS.PAYMENT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else if (error.message === PAYMENT_ERRORS.CANNOT_REFUND) {
      res.status(400).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Abort/Cancel a payment
 */
export const abortPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await paymentService.abortPayment(id);

    res
      .status(200)
      .json(successResponse(payment, RESPONSE_MESSAGES.PAYMENT_CANCELLED));
  } catch (error) {
    logger.error("Error aborting payment:", error);

    if (error.message === PAYMENT_ERRORS.PAYMENT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else if (error.message === PAYMENT_ERRORS.CANNOT_CANCEL) {
      res.status(400).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Seed payments for testing
 */
export const seedPaymentsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { count } = req.body;
    const result = await paymentService.seedPayments(count);

    res
      .status(200)
      .json(successResponse(result, RESPONSE_MESSAGES.PAYMENTS_SEEDED));
  } catch (error) {
    logger.error("Error seeding payments:", error);
    res.status(500).json(errorResponse(error.message));
  }
};
