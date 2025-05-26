import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import {
  authenticate,
  isAdmin,
  isSameUserOrAdmin,
} from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderItemSchema,
  applyDiscountSchema,
  cancelOrderSchema,
  seedOrdersSchema,
} from "../middleware/validation.middleware";

const router = Router();

// Base routes - protected by auth
router.use(authenticate);

// Order creation
router.post(
  "/create",
  validate(createOrderSchema),
  orderController.createOrder
);

// User's own orders
router.get("/getUsersOrders", orderController.getMyOrders);

// Order management
router.get("/:id/items", orderController.getOrderItems);
router.patch(
  "/:id/status",
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);
router.patch(
  "/:id/cancel",
  validate(cancelOrderSchema),
  orderController.cancelOrder
);
router.patch(
  "/:id/items/:itemId/cancel",
  validate(cancelOrderSchema),
  orderController.cancelOrderItem
);
router.get("/:id/status-log", orderController.getOrderStatusLog);
router.post(
  "/:id/discount",
  validate(applyDiscountSchema),
  orderController.applyOrderDiscount
);

// Order item management
router.patch(
  "/:orderId/items/:itemId",
  validate(updateOrderItemSchema),
  orderController.updateOrderItem
);
router.delete("/:orderId/items/:itemId", orderController.deleteOrderItem);

// Detailed views
router.get(
  "/:orderId/details",
  orderController.getOrderDetailWithItemsAndPaymentsController
);
router.get(
  "/:orderId/detailsWithShippingAddress",
  orderController.getOrderDetailsWithShippingAddressController
);

// Admin routes
router.get("/getAllOrders", orderController.getAllOrders);
router.get("/user/:userId", orderController.getOrdersByUserId);

// Seeding utility (admin only)
router.post(
  "/seed-orders",
  // isAdmin,
  validate(seedOrdersSchema),
  orderController.seedOrders
);

export default router;
