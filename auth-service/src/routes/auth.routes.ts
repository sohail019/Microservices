import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.post("/register", authController.register); // Add this line
router.post("/login", authController.login);
router.post("/oauth/login", authController.oauthLogin);
router.post("/refresh-token", authController.refreshToken);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerificationEmail);
router.post("/validate-token", authController.validateToken);

// Protected routes (require authentication)
router.use(authenticate);
router.post("/logout", authController.logout);
router.get("/status", authController.getAuthStatus);

export default router;
