import axios from "axios";
import { env } from "../config/env";
import { ProductDto } from "../interfaces/cart.interface";
import { createLogger } from "../utils/logger";

const logger = createLogger("ProductService");
const PRODUCT_SERVICE_URL = `${env.productServiceUrl}/products`;

/**
 * Get product by ID from product service
 */
export const getProductById = async (
  productId: string
): Promise<ProductDto | null> => {
  try {
    logger.debug("Fetching product details", { productId });

    const response = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);

    if (response.data && response.data.success) {
      logger.debug("Product details fetched successfully", { productId });
      return response.data.data;
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
 * Get cart with product details
 */
export const getCartWithProducts = async (cart: any): Promise<any> => {
  try {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        ...cart,
        items: [],
        summary: {
          totalItems: 0,
          subtotal: 0,
          totalProducts: 0,
          unavailableItems: 0,
        },
      };
    }

    // Extract product IDs from cart items
    const productIds = cart.items.map((item: any) => item.productId);

    // Get products in bulk
    const productsMap = await getProductsByIds(productIds);

    // Enhance cart items with product details
    const enhancedItems = cart.items.map((item: any) => {
      const product = productsMap[item.productId];

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        status: item.status,
        addedAt: item.addedAt,
        product: product || undefined,
      };
    });

    // Calculate cart summary with product details
    let totalItems = 0;
    let subtotal = 0;
    let unavailableItems = 0;

    enhancedItems.forEach((item: any) => {
      if (item.status === "active") {
        totalItems += item.quantity;

        if (item.product) {
          subtotal += item.product.price * item.quantity;

          if (
            !item.product.isAvailable ||
            item.product.quantity < item.quantity
          ) {
            unavailableItems++;
          }
        } else {
          unavailableItems++;
        }
      }
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: enhancedItems,
      summary: {
        totalItems,
        subtotal,
        totalProducts: enhancedItems.filter(
          (item: any) => item.status === "active"
        ).length,
        unavailableItems,
      },
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  } catch (error) {
    logger.error("Error enhancing cart with products:", error);
    throw error;
  }
};
