import { Request, Response } from "express";
import * as cartService from "../services/cart.service";
import * as productService from "../services/product.service";
import { AddToCartDto, UpdateCartItemDto } from "../interfaces/cart.interface";
import { RESPONSE_MESSAGES } from "../config/constants";
import { successResponse, errorResponse } from "../utils/response";
import { createLogger } from "../utils/logger";

const logger = createLogger("CartController");

/**
 * Get user's cart
 */
export const getUserCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const cart = await cartService.getUserCart(userId);
    res.status(200).json(successResponse(cart));
  } catch (error) {
    logger.error("Get user cart error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const itemData: AddToCartDto = req.body;
    const updatedCart = await cartService.addToCart(userId, itemData);
    res
      .status(200)
      .json(successResponse(updatedCart, RESPONSE_MESSAGES.CART_ITEM_ADDED));
  } catch (error) {
    logger.error("Add to cart error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Update cart item
 */
export const updateCartItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const updateData: UpdateCartItemDto = req.body;
    const updatedCart = await cartService.updateCartItem(
      userId,
      id,
      updateData
    );
    res
      .status(200)
      .json(successResponse(updatedCart, RESPONSE_MESSAGES.CART_ITEM_UPDATED));
  } catch (error) {
    logger.error("Update cart item error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const updatedCart = await cartService.removeFromCart(userId, id);
    res
      .status(200)
      .json(successResponse(updatedCart, RESPONSE_MESSAGES.CART_ITEM_REMOVED));
  } catch (error) {
    logger.error("Remove from cart error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Clear cart
 */
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const result = await cartService.clearCart(userId);
    res
      .status(200)
      .json(successResponse(result, RESPONSE_MESSAGES.CART_CLEARED));
  } catch (error) {
    logger.error("Clear cart error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Save item for later
 */
export const saveForLater = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const updatedCart = await cartService.saveForLater(userId, id);
    res
      .status(200)
      .json(
        successResponse(updatedCart, RESPONSE_MESSAGES.ITEM_SAVED_FOR_LATER)
      );
  } catch (error) {
    logger.error("Save for later error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Move to cart (from saved for later)
 */
export const moveToCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const updatedCart = await cartService.moveToCart(userId, id);
    res
      .status(200)
      .json(successResponse(updatedCart, RESPONSE_MESSAGES.ITEM_MOVED_TO_CART));
  } catch (error) {
    logger.error("Move to cart error:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get user's cart with product details
 */
export const getMyCartWithProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const cart = await cartService.getUserCart(userId);
    const cartWithProducts = await productService.getCartWithProducts(cart);
    res.status(200).json(successResponse(cartWithProducts));
  } catch (error) {
    logger.error("Get cart with products error:", error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get specific cart with product details (admin)
 */
export const getCartWithProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cartId } = req.params;

    // Admin check already handled by middleware

    const cart = await cartService.getCartById(cartId);

    // Format the cart to match the interface structure
    const formattedCart = {
      id: cart._id.toString(),
      userId: cart.userId,
      items: cart.items.map((item: any) => ({
        id: item._id.toString(),
        productId: item.productId,
        quantity: item.quantity,
        status: item.status,
        addedAt: item.addedAt,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    const cartWithProducts = await productService.getCartWithProducts(
      formattedCart
    );
    res.status(200).json(successResponse(cartWithProducts));
  } catch (error) {
    logger.error("Get cart with products by ID error:", error);

    if (error.message === "Cart not found") {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse(error.message));
    }
  }
};
