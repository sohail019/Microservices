import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { authenticate, isAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../middleware/validation.middleware";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Basic cart operations
router.get("/", cartController.getUserCart);
router.post("/items", validate(addToCartSchema), cartController.addToCart);
router.put(
  "/items/updateCartItem/:id",
  validate(updateCartItemSchema),
  cartController.updateCartItem
);
router.delete("/items/removeFromCart/:id", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

// Saved for later functionality
router.post("/items/:id/save-for-later", cartController.saveForLater);
router.post("/items/:id/move-to-cart", cartController.moveToCart);

// Cart with product details
router.get("/getMyCartWithProducts", cartController.getMyCartWithProducts);

// Admin route - requires admin role
router.get(
  "/:cartId/getCartWithProducts",
  isAdmin,
  cartController.getCartWithProducts
);

export default router;
