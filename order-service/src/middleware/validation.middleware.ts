import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "../utils/response";
import {
  ORDER_STATUSES,
  ORDER_ITEM_STATUSES,
  DISCOUNT_TYPES,
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

// Create order validation schema
export const createOrderSchema = Joi.object({
  cartId: Joi.string().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .optional(),
  discountAmount: Joi.number().min(0).optional(),
  discountType: Joi.string()
    .valid(...Object.values(DISCOUNT_TYPES))
    .optional(),
  gstNumber: Joi.string().optional(),
  currency: Joi.string().optional(),
}).xor("cartId", "items"); // Either cartId or items must be provided, not both

// Update order status validation schema
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUSES))
    .required(),
  comment: Joi.string().optional(),
});

// Update order item validation schema
export const updateOrderItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).optional(),
  status: Joi.string()
    .valid(...Object.values(ORDER_ITEM_STATUSES))
    .optional(),
}).min(1); // At least one field is required

// Apply discount validation schema
export const applyDiscountSchema = Joi.object({
  discountAmount: Joi.number().min(0).required(),
  discountType: Joi.string()
    .valid(...Object.values(DISCOUNT_TYPES))
    .required(),
});

// Cancel order validation schema
export const cancelOrderSchema = Joi.object({
  reason: Joi.string().optional(),
});

// Seed orders validation schema
export const seedOrdersSchema = Joi.object({
  count: Joi.number().integer().min(1).optional(),
});
