import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "../utils/response";

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

// Validation schemas
export const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1),
  status: Joi.string().valid("active", "saved_for_later", "removed"),
}).min(1);
