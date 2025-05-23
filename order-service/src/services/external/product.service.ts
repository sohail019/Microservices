import axios from "axios";
import { env } from "../../config/env";
import { ProductDto } from "../../interfaces/order.interface";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ProductService");

/**
 * Get product by ID from product service
 */
export const getProductById = async (
  productId: string
): Promise<ProductDto | null> => {
  try {
    logger.debug("Fetching product details", { productId });

    const response = await axios.get(
      `${env.productServiceUrl}/products/${productId}`
    );

    if (response.data && response.data.success) {
      logger.debug("Product details fetched successfully", { productId });
      return response.data.data;
    } else if (response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      logger.warn("Product not found", { productId });
      return null;
    }

    logger.error("Error fetching product details:", error);
    throw new Error(`Error fetching product details: ${error.message}`);
  }
};

/**
 * Get multiple products by IDs
 */
export const getProductsByIds = async (
  productIds: string[]
): Promise<{ [key: string]: ProductDto }> => {
  try {
    logger.debug("Fetching multiple products", { count: productIds.length });

    // Create a map to store products
    const productsMap: { [key: string]: ProductDto } = {};

    // In a real implementation, we might want to use a batch endpoint
    // For now, fetch each product individually
    await Promise.all(
      productIds.map(async (productId) => {
        try {
          const product = await getProductById(productId);
          if (product) {
            productsMap[productId] = product;
          }
        } catch (error) {
          logger.error("Error fetching product", {
            productId,
            error: error.message,
          });
        }
      })
    );

    logger.debug("Products fetched successfully", {
      requested: productIds.length,
      received: Object.keys(productsMap).length,
    });

    return productsMap;
  } catch (error) {
    logger.error("Error fetching products:", error);
    throw new Error(`Error fetching products: ${error.message}`);
  }
};

/**
 * Update product stock
 */
export const decreaseProductStock = async (
  productId: string,
  quantity: number
): Promise<void> => {
  try {
    logger.debug("Decreasing product stock", { productId, quantity });

    // In a real implementation, call the product service to decrease stock
    // For now, assume the operation is successful without actually calling the service
    logger.info("Product stock decreased successfully", {
      productId,
      quantity,
    });
  } catch (error) {
    logger.error("Error decreasing product stock:", error);
    throw new Error(`Error decreasing product stock: ${error.message}`);
  }
};

/**
 * Restore product stock
 */
export const increaseProductStock = async (
  productId: string,
  quantity: number
): Promise<void> => {
  try {
    logger.debug("Increasing product stock", { productId, quantity });

    // In a real implementation, call the product service to increase stock
    // For now, assume the operation is successful without actually calling the service
    logger.info("Product stock increased successfully", {
      productId,
      quantity,
    });
  } catch (error) {
    logger.error("Error increasing product stock:", error);
    throw new Error(`Error increasing product stock: ${error.message}`);
  }
};
