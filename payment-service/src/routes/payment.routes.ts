import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import {
  authenticate,
  isAdmin,
  isSameUserOrAdmin,
} from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  initiatePaymentSchema,
  webhookSchema,
  refundPaymentSchema,
  seedPaymentsSchema,
} from "../middleware/validation.middleware";

const router = Router();

// Public routes (no authentication required)
router.post(
  "/webhook",
  validate(webhookSchema),
  paymentController.handleWebhook
);
router.post(
  "/seed",
  validate(seedPaymentsSchema),
  paymentController.seedPaymentsController
);

// All routes below this require authentication
router.use(authenticate);

// Payment operations
router.post(
  "/initiate",
  validate(initiatePaymentSchema),
  paymentController.initiatePayment
);
router.get("/order/:orderId", paymentController.getPaymentsByOrderId);
router.get(
  "/user/:userId",
  isSameUserOrAdmin("userId"),
  paymentController.getPaymentsByUserId
);
router.get("/me", paymentController.getMyPayments);
router.post(
  "/:id/refund",
  validate(refundPaymentSchema),
  paymentController.refundPayment
);
router.post("/abort/:id", paymentController.abortPayment);
router.get("/:id", paymentController.getPaymentById);

export default router;
