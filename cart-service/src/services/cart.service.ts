import mongoose from "mongoose";
import CartModel from "../models/cart.model";
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartSummaryDto,
} from "../interfaces/cart.interface";
import { CART_ERRORS, CART_ITEM_STATUS } from "../config/constants";
import { createLogger } from "../utils/logger";
import { getProductById } from "./product.service";

const logger = createLogger("CartService");

/**
 * Get user's cart details with items
 */
export const getUserCart = async (userId: string): Promise<CartResponseDto> => {
  try {
    logger.debug("Fetching user cart", { userId });

    // Find or create cart for user
    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = await new CartModel({ userId }).save();
      logger.info("Created new cart for user", { userId });
    }

    // Filter to only include active items
    const activeItems = cart.items.filter(
      (item) => item.status === CART_ITEM_STATUS.ACTIVE
    );

    // Calculate cart summary
    const summary = calculateCartSummary(activeItems);

    // Format response
    const response: CartResponseDto = {
      id: cart._id.toString(),
      userId: cart.userId,
      items: activeItems.map((item) => ({
        id: item._id.toString(),
        productId: item.productId,
        quantity: item.quantity,
        status: item.status,
        addedAt: item.addedAt,
      })),
      summary,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    return response;
  } catch (error) {
    logger.error("Error getting user cart:", error);
    throw error;
  }
};

/**
 * Add an item to the user's cart
 */
export const addToCart = async (
  userId: string,
  itemData: AddToCartDto
): Promise<CartResponseDto> => {
  try {
    logger.debug("Adding item to cart", {
      userId,
      productId: itemData.productId,
    });

    // Check if product is available
    const product = await getProductById(itemData.productId);
    console.log("Product details:", product);
    logger.debug("Product details fetched", {
      productId: itemData.productId,
      isAvailable: product?.isAvailable,
      quantity: product?.quantity,
    });
    // If product not found or not available, throw error

    if (!product) {
      throw new Error(CART_ERRORS.PRODUCT_NOT_FOUND);
    }

    if (!product.isAvailable || product.quantity < itemData.quantity) {
      throw new Error(CART_ERRORS.PRODUCT_NOT_AVAILABLE);
    }

    // Find or create cart
    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = new CartModel({ userId });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === itemData.productId
    );

    if (existingItemIndex !== -1) {
      // Item exists, update quantity if it's active or change status back to active
      const existingItem = cart.items[existingItemIndex];

      if (existingItem.status === CART_ITEM_STATUS.ACTIVE) {
        existingItem.quantity += itemData.quantity;
      } else {
        existingItem.status = CART_ITEM_STATUS.ACTIVE;
        existingItem.quantity = itemData.quantity;
      }
    } else {
      // Add new item to cart
      cart.items.push({
        productId: itemData.productId,
        quantity: itemData.quantity,
        status: CART_ITEM_STATUS.ACTIVE,
        addedAt: new Date(),
      } as any);
    }

    await cart.save();
    logger.info("Item added to cart", {
      userId,
      productId: itemData.productId,
    });

    return await getUserCart(userId);
  } catch (error) {
    logger.error("Error adding item to cart:", error);
    throw error;
  }
};

/**
 * Update a cart item
 */
export const updateCartItem = async (
  userId: string,
  itemId: string,
  updateData: UpdateCartItemDto
): Promise<CartResponseDto> => {
  try {
    logger.debug("Updating cart item", { userId, itemId, updateData });

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      throw new Error(CART_ERRORS.CART_NOT_FOUND);
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new Error(CART_ERRORS.ITEM_NOT_FOUND);
    }

    const item = cart.items[itemIndex];

    // Update quantity if provided
    if (updateData.quantity !== undefined) {
      // Check product availability
      const product = await getProductById(item.productId);

      if (!product) {
        throw new Error(CART_ERRORS.PRODUCT_NOT_FOUND);
      }

      if (!product.isAvailable || product.quantity < updateData.quantity) {
        throw new Error(CART_ERRORS.PRODUCT_NOT_AVAILABLE);
      }

      item.quantity = updateData.quantity;
    }

    // Update status if provided
    if (updateData.status !== undefined) {
      item.status = updateData.status;
    }

    await cart.save();
    logger.info("Cart item updated", { userId, itemId });

    return await getUserCart(userId);
  } catch (error) {
    logger.error("Error updating cart item:", error);
    throw error;
  }
};

/**
 * Remove an item from the cart
 */
export const removeFromCart = async (
  userId: string,
  itemId: string
): Promise<CartResponseDto> => {
  try {
    logger.debug("Removing item from cart", { userId, itemId });

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      throw new Error(CART_ERRORS.CART_NOT_FOUND);
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new Error(CART_ERRORS.ITEM_NOT_FOUND);
    }

    // Update status to removed
    cart.items[itemIndex].status = CART_ITEM_STATUS.REMOVED;

    await cart.save();
    logger.info("Item removed from cart", { userId, itemId });

    return await getUserCart(userId);
  } catch (error) {
    logger.error("Error removing item from cart:", error);
    throw error;
  }
};

/**
 * Clear user's cart
 */
export const clearCart = async (
  userId: string
): Promise<{ message: string }> => {
  try {
    logger.debug("Clearing cart", { userId });

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      throw new Error(CART_ERRORS.CART_NOT_FOUND);
    }

    // Mark all items as removed
    cart.items.forEach((item) => {
      item.status = CART_ITEM_STATUS.REMOVED;
    });

    await cart.save();
    logger.info("Cart cleared", { userId });

    return { message: "Cart cleared successfully" };
  } catch (error) {
    logger.error("Error clearing cart:", error);
    throw error;
  }
};

/**
 * Save an item for later
 */
export const saveForLater = async (
  userId: string,
  itemId: string
): Promise<CartResponseDto> => {
  try {
    logger.debug("Saving item for later", { userId, itemId });

    return await updateCartItem(userId, itemId, {
      status: CART_ITEM_STATUS.SAVED_FOR_LATER,
    });
  } catch (error) {
    logger.error("Error saving item for later:", error);
    throw error;
  }
};

/**
 * Move item from saved for later back to active cart
 */
export const moveToCart = async (
  userId: string,
  itemId: string
): Promise<CartResponseDto> => {
  try {
    logger.debug("Moving item to cart", { userId, itemId });

    return await updateCartItem(userId, itemId, {
      status: CART_ITEM_STATUS.ACTIVE,
    });
  } catch (error) {
    logger.error("Error moving item to cart:", error);
    throw error;
  }
};

/**
 * Get saved for later items
 */
export const getSavedForLaterItems = async (userId: string): Promise<any> => {
  try {
    logger.debug("Fetching saved for later items", { userId });

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      return { items: [] };
    }

    // Filter to only include saved for later items
    const savedItems = cart.items.filter(
      (item) => item.status === CART_ITEM_STATUS.SAVED_FOR_LATER
    );

    return {
      items: savedItems.map((item) => ({
        id: item._id.toString(),
        productId: item.productId,
        quantity: item.quantity,
        status: item.status,
        addedAt: item.addedAt,
      })),
    };
  } catch (error) {
    logger.error("Error getting saved items:", error);
    throw error;
  }
};

/**
 * Helper: Calculate cart summary
 */
function calculateCartSummary(cartItems: any[]): CartSummaryDto {
  let totalItems = 0;

  // For actual price calculation, we would need product data
  // This is simplified since prices will come from product service
  cartItems.forEach((item) => {
    totalItems += item.quantity;
  });

  return {
    totalItems,
    subtotal: 0, // Will be calculated when we get product details
  };
}

/**
 * Get cart by ID (for admin use)
 */
export const getCartById = async (cartId: string): Promise<any> => {
  try {
    logger.debug("Fetching cart by ID", { cartId });

    const cart = await CartModel.findById(cartId);

    if (!cart) {
      throw new Error(CART_ERRORS.CART_NOT_FOUND);
    }

    return cart;
  } catch (error) {
    logger.error("Error getting cart by ID:", error);
    throw error;
  }
};
