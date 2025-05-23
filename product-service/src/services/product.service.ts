import mongoose from "mongoose";
import Product from "../models/product.model";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
  ProductsListResponse,
} from "../interfaces/product.interface";
import { PRODUCT_ERRORS, PAGINATION_DEFAULTS } from "../config/constants";
import { createLogger } from "../utils/logger";

const logger = createLogger("ProductService");

/**
 * Create a new product
 */
export const createProduct = async (productData: CreateProductDto) => {
  try {
    logger.debug("Creating new product", { name: productData.name });

    // Generate slug if not provided
    if (!productData.slug) {
      productData.slug = (Product as any).generateSlug(productData.name);
    }

    // Check if product with same slug exists
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      logger.warn("Product creation failed - slug already exists", {
        slug: productData.slug,
      });
      throw new Error(PRODUCT_ERRORS.DUPLICATE_SLUG);
    }

    // Create and save the product
    const product = new Product(productData);
    await product.save();

    logger.info("Product created successfully", {
      id: product.id,
      name: product.name,
    });
    return product;
  } catch (error) {
    logger.error("Error creating product:", error);
    throw error;
  }
};

/**
 * Get all products with filters and pagination
 */
export const getAllProducts = async (query: ProductQueryParams = {}) => {
  try {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
      name,
      minPrice,
      maxPrice,
      category,
      brand,
      tags,
      isAvailable,
      userId,
    } = query;

    logger.debug("Fetching products with query", { page, limit, sort });

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (category) filter.categoryId = category;
    if (brand) filter.brandId = brand;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;
    if (tags) filter.tags = { $in: tags.split(",") };
    if (userId) filter.userId = userId;

    // Determine sort direction and field
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const total = await Product.countDocuments(filter);

    logger.info("Products fetched successfully", {
      count: products.length,
      total,
    });

    return {
      products,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching products:", error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (id: string) => {
  try {
    logger.debug("Fetching product by ID", { id });

    const product = await Product.findById(id).lean();

    if (!product) {
      logger.warn("Product not found", { id });
      throw new Error(PRODUCT_ERRORS.PRODUCT_NOT_FOUND);
    }

    logger.info("Product fetched successfully", { id });
    return product;
  } catch (error) {
    logger.error("Error fetching product by ID:", error);
    throw error;
  }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug: string) => {
  try {
    logger.debug("Fetching product by slug", { slug });

    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      logger.warn("Product not found", { slug });
      throw new Error(PRODUCT_ERRORS.PRODUCT_NOT_FOUND);
    }

    logger.info("Product fetched successfully", { slug });
    return product;
  } catch (error) {
    logger.error("Error fetching product by slug:", error);
    throw error;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
  categoryId: string,
  query: ProductQueryParams
) => {
  try {
    logger.debug("Fetching products by category", { categoryId });

    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
    } = query;

    const skip = (page - 1) * limit;

    // Determine sort direction and field
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

    // Execute query with pagination
    const products = await Product.find({ categoryId })
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const total = await Product.countDocuments({ categoryId });

    logger.info("Products by category fetched successfully", {
      categoryId,
      count: products.length,
    });

    return {
      products,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching products by category:", error);
    throw error;
  }
};

/**
 * Get products by brand
 */
export const getProductsByBrand = async (
  brandId: string,
  query: ProductQueryParams
) => {
  try {
    logger.debug("Fetching products by brand", { brandId });

    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
    } = query;

    const skip = (page - 1) * limit;

    // Determine sort direction and field
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

    // Execute query with pagination
    const products = await Product.find({ brandId })
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const total = await Product.countDocuments({ brandId });

    logger.info("Products by brand fetched successfully", {
      brandId,
      count: products.length,
    });

    return {
      products,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching products by brand:", error);
    throw error;
  }
};

/**
 * Search products by keyword
 */
export const searchProducts = async (
  searchTerm: string,
  query: ProductQueryParams
) => {
  try {
    logger.debug("Searching products", { searchTerm });

    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = PAGINATION_DEFAULTS.SORT,
    } = query;

    const skip = (page - 1) * limit;

    // Build text search query
    const filter = {
      $text: { $search: searchTerm },
    };

    // Determine sort direction and field
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const total = await Product.countDocuments(filter);

    logger.info("Product search completed", {
      searchTerm,
      count: products.length,
    });

    return {
      products,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error searching products:", error);
    throw error;
  }
};

/**
 * Update product by ID
 */
export const updateProductById = async (
  id: string,
  updateData: UpdateProductDto
) => {
  try {
    logger.debug("Updating product", { id });

    // Generate slug if name is updated but slug is not provided
    if (updateData.name && !updateData.slug) {
      updateData.slug = (Product as any).generateSlug(updateData.name);
    }

    // If slug is updated, check if it already exists
    if (updateData.slug) {
      const existingProduct = await Product.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });

      if (existingProduct) {
        logger.warn("Product update failed - slug already exists", {
          slug: updateData.slug,
        });
        throw new Error(PRODUCT_ERRORS.DUPLICATE_SLUG);
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      logger.warn("Product not found", { id });
      throw new Error(PRODUCT_ERRORS.PRODUCT_NOT_FOUND);
    }

    logger.info("Product updated successfully", { id });
    return product;
  } catch (error) {
    logger.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Delete product by ID
 */
export const deleteProductById = async (id: string) => {
  try {
    logger.debug("Deleting product", { id });

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      logger.warn("Product not found", { id });
      throw new Error(PRODUCT_ERRORS.PRODUCT_NOT_FOUND);
    }

    logger.info("Product deleted successfully", { id });
    return { id };
  } catch (error) {
    logger.error("Error deleting product:", error);
    throw error;
  }
};

/**
 * Check product availability
 */
export const checkProductAvailability = async (id: string) => {
  try {
    logger.debug("Checking product availability", { id });

    const product = await Product.findById(id, {
      isAvailable: 1,
      quantity: 1,
      name: 1,
    }).lean();

    if (!product) {
      logger.warn("Product not found", { id });
      throw new Error(PRODUCT_ERRORS.PRODUCT_NOT_FOUND);
    }

    logger.info("Product availability checked", {
      id,
      isAvailable: product.isAvailable,
    });
    return {
      id,
      name: product.name,
      isAvailable: product.isAvailable && product.quantity > 0,
      quantity: product.quantity,
    };
  } catch (error) {
    logger.error("Error checking product availability:", error);
    throw error;
  }
};

/**
 * Seed products (for demo/testing)
 */
export const seedProducts = async (count: number = 50) => {
  try {
    logger.debug("Seeding products", { count });

    const products = [];
    const categories = ["electronics", "clothing", "books", "home", "sports"];
    const brands = ["apple", "samsung", "nike", "amazon", "sony"];

    for (let i = 0; i < count; i++) {
      const name = `Test Product ${i + 1}`;
      const slug = (Product as any).generateSlug(name);
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];

      products.push({
        name,
        slug: `${slug}-${i}`, // Ensure uniqueness
        description: `Description for ${name}`,
        price: Math.floor(Math.random() * 1000) + 1,
        compareAtPrice: Math.floor(Math.random() * 1500) + 1000,
        quantity: Math.floor(Math.random() * 100),
        isAvailable: Math.random() > 0.2, // 80% available
        categoryId: category,
        brandId: brand,
        tags: [category, brand, Math.random() > 0.5 ? "featured" : "sale"],
        images: [
          `https://picsum.photos/seed/${i}/400/300`,
          `https://picsum.photos/seed/${i + count}/400/300`,
        ],
        thumbnailImage: `https://picsum.photos/seed/${i}/200/200`,
      });
    }

    await Product.insertMany(products);

    logger.info("Products seeded successfully", { count });
    return { count };
  } catch (error) {
    logger.error("Error seeding products:", error);
    throw error;
  }
};
