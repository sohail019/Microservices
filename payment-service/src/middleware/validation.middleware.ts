import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "../utils/response";
import {
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PAYMENT_GATEWAYS,
  PAYMENT_STATUSES,
} from "../config/constants";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error) {
      res.status(400).json(
        errorResponse(
          "Validation error",
          error.details.map((detail) => detail.message)
        )
      );
    } else {
      next();
    }
  };
};

// Payment validation schemas
export const initiatePaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number().min(0),
  currency: Joi.string().max(3),
  method: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required(),
  paymentType: Joi.string().valid(...Object.values(PAYMENT_TYPES)),
  gateway: Joi.string()
    .valid(...Object.values(PAYMENT_GATEWAYS))
    .required(),
  metadata: Joi.object(),
  returnUrl: Joi.string().uri(),
});

export const webhookSchema = Joi.object({
  event: Joi.string().required(),
  gateway: Joi.string()
    .valid(...Object.values(PAYMENT_GATEWAYS))
    .required(),
  gatewayPaymentId: Joi.string().required(),
  data: Joi.object().required(),
});

export const refundPaymentSchema = Joi.object({
  amount: Joi.number().min(0),
  reason: Joi.string().required(),
});

export const seedPaymentsSchema = Joi.object({
  count: Joi.number().integer().min(1).max(100),
});
