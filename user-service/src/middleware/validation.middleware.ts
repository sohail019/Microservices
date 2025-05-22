import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.details.map((detail) => detail.message),
        },
      });
    } else {
      next();
    }
  };
};

// Validation schemas
export const createUserSchema = Joi.object({
  authId: Joi.string().required(),
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string(),
  profileImage: Joi.string().uri(),
  dateOfBirth: Joi.date(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string(),
  }),
  preferences: Joi.object({
    theme: Joi.string(),
    language: Joi.string(),
    notifications: Joi.boolean(),
  }),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string(),
  phone: Joi.string(),
  profileImage: Joi.string().uri(),
  dateOfBirth: Joi.date(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string(),
  }),
  preferences: Joi.object({
    theme: Joi.string(),
    language: Joi.string(),
    notifications: Joi.boolean(),
  }),
});

export const addressSchema = Joi.object({
  street: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  postalCode: Joi.string(),
  country: Joi.string(),
});

export const preferencesSchema = Joi.object({
  theme: Joi.string(),
  language: Joi.string(),
  notifications: Joi.boolean(),
});

export const profileImageSchema = Joi.object({
  profileImage: Joi.string().uri().required(),
});
