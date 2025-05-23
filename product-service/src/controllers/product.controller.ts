import { Request, Response } from "express";
import * as productService from "../services/product.service";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
} from "../interfaces/product.interface";
import { RESPONSE_MESSAGES, PRODUCT_ERRORS } from "../config/constants";
import { successResponse, errorResponse } from "../utils/response";
import { createLogger } from "../utils/logger";

const logger = createLogger("ProductController");

/**
 * Create a new product
 */
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const productData: CreateProductDto = { ...req.body };

    // If user is authenticated, assign the product to them
    if (userId) {
      productData.userId = userId;
    }

    const product = await productService.createProduct(productData);
    res
      .status(201)
      .json(successResponse(product, RESPONSE_MESSAGES.PRODUCT_CREATED));
  } catch (error) {
    logger.error("Create product error:", error);

    if (error.message === PRODUCT_ERRORS.DUPLICATE_SLUG) {
      res.status(409).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Get all products with filtering and pagination
 */
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query: ProductQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
      name: req.query.name as string,
      minPrice: req.query.minPrice
        ? parseFloat(req.query.minPrice as string)
        : undefined,
      maxPrice: req.query.maxPrice
        ? parseFloat(req.query.maxPrice as string)
        : undefined,
      category: req.query.category as string,
      brand: req.query.brand as string,
      isAvailable: req.query.isAvailable
        ? req.query.isAvailable === "true"
        : undefined,
      tags: req.query.tags as string,
      userId: req.query.userId as string,
    };

    const result = await productService.getAllProducts(query);
    res.status(200).json(successResponse(result));
  } catch (error) {
    logger.error("Get all products error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.status(200).json(successResponse(product));
  } catch (error) {
    logger.error("Get product by ID error:", error);

    if (error.message === PRODUCT_ERRORS.PRODUCT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);
    res.status(200).json(successResponse(product));
  } catch (error) {
    logger.error("Get product by slug error:", error);

    if (error.message === PRODUCT_ERRORS.PRODUCT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.params;
    const query: ProductQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
    };

    const products = await productService.getProductsByCategory(
      category,
      query
    );
    res.status(200).json(successResponse(products));
  } catch (error) {
    logger.error("Get products by category error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get products by brand
 */
export const getProductsByBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { brand } = req.params;
    const query: ProductQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
    };

    const products = await productService.getProductsByBrand(brand, query);
    res.status(200).json(successResponse(products));
  } catch (error) {
    logger.error("Get products by brand error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Search products
 */
export const searchProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json(errorResponse("Search query is required"));
      return;
    }

    const query: ProductQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
    };

    const products = await productService.searchProducts(q, query);
    res.status(200).json(successResponse(products));
  } catch (error) {
    logger.error("Search products error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Update product by ID
 */
export const updateProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateProductDto = req.body;

    // First check if the product exists and belongs to the user
    const product = await productService.getProductById(id);

    // If product has a userId and it doesn't match the requester's userId
    if (
      product.userId &&
      req.user?.userId !== product.userId &&
      req.user?.role !== "admin"
    ) {
      res
        .status(403)
        .json(
          errorResponse("You don't have permission to update this product")
        );
      return;
    }

    const updatedProduct = await productService.updateProductById(
      id,
      updateData
    );
    res
      .status(200)
      .json(successResponse(updatedProduct, RESPONSE_MESSAGES.PRODUCT_UPDATED));
  } catch (error) {
    logger.error("Update product error:", error);

    if (error.message === PRODUCT_ERRORS.PRODUCT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else if (error.message === PRODUCT_ERRORS.DUPLICATE_SLUG) {
      res.status(409).json(errorResponse(error.message));
    } else {
      res.status(400).json(errorResponse(error.message));
    }
  }
};

/**
 * Delete product by ID
 */
export const deleteProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // First check if the product exists and belongs to the user
    const product = await productService.getProductById(id);

    // If product has a userId and it doesn't match the requester's userId
    if (
      product.userId &&
      req.user?.userId !== product.userId &&
      req.user?.role !== "admin"
    ) {
      res
        .status(403)
        .json(
          errorResponse("You don't have permission to delete this product")
        );
      return;
    }

    const result = await productService.deleteProductById(id);
    res
      .status(200)
      .json(successResponse(result, RESPONSE_MESSAGES.PRODUCT_DELETED));
  } catch (error) {
    logger.error("Delete product error:", error);

    if (error.message === PRODUCT_ERRORS.PRODUCT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Check product availability
 */
export const checkProductAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const availability = await productService.checkProductAvailability(id);
    res.status(200).json(successResponse(availability));
  } catch (error) {
    logger.error("Check product availability error:", error);

    if (error.message === PRODUCT_ERRORS.PRODUCT_NOT_FOUND) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};

/**
 * Seed products (for demo/testing)
 */
export const seedProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = req.body.count || 50;
    const result = await productService.seedProducts(count);
    res
      .status(201)
      .json(successResponse(result, RESPONSE_MESSAGES.PRODUCTS_SEEDED));
  } catch (error) {
    logger.error("Seed products error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};
