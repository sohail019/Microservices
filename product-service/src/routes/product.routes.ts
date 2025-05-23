import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../middleware/validation.middleware";
import * as productController from "../controllers/product.controller";

const router = Router();

// Public routes (no auth required)
router.get("/getAll", productController.getAllProducts);
router.get("/search", productController.searchProducts);
router.get("/:id", productController.getProductById);
router.get("/:id/availability", productController.checkProductAvailability);
router.get("/slug/:slug", productController.getProductBySlug);
router.get("/category/:category", productController.getProductsByCategory);
router.get("/brand/:brand", productController.getProductsByBrand);
router.post("/seeding", productController.seedProducts);

// Protected routes (require JWT token)
router.post(
  "/",
  authenticate,
  validate(createProductSchema),
  productController.createProduct
);
router.patch(
  "/:id",
  authenticate,
  validate(updateProductSchema),
  productController.updateProductById
);
router.delete("/:id", authenticate, productController.deleteProductById);

export default router;
