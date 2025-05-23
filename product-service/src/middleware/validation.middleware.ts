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
export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string(),
  description: Joi.string().allow(""),
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0),
  costPrice: Joi.number().min(0),
  sku: Joi.string(),
  barcode: Joi.string(),
  quantity: Joi.number().integer().min(0),
  isAvailable: Joi.boolean(),
  weight: Joi.number().min(0),
  weightUnit: Joi.string().valid("g", "kg", "oz", "lb"),
  categoryId: Joi.string(),
  brandId: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string().uri()),
  thumbnailImage: Joi.string().uri(),
  attributes: Joi.object(),
  metadata: Joi.object(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string(),
  slug: Joi.string(),
  description: Joi.string().allow(""),
  price: Joi.number().min(0),
  compareAtPrice: Joi.number().min(0),
  costPrice: Joi.number().min(0),
  sku: Joi.string(),
  barcode: Joi.string(),
  quantity: Joi.number().integer().min(0),
  isAvailable: Joi.boolean(),
  weight: Joi.number().min(0),
  weightUnit: Joi.string().valid("g", "kg", "oz", "lb"),
  categoryId: Joi.string(),
  brandId: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string().uri()),
  thumbnailImage: Joi.string().uri(),
  attributes: Joi.object(),
  metadata: Joi.object(),
});
