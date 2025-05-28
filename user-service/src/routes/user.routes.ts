import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import * as validators from "../middleware/validation.middleware";

const router = Router();

// Public routes that don't require authentication
// These routes are typically called by the auth service

// Create a new user (called from auth-service when users register)
router.post(
  "/",
  validate(validators.createUserSchema),
  userController.createUser
);

// Get user by Auth ID (used by auth service)
router.get("/auth/:authId", userController.getUserByAuthId);

// Protected routes (require authentication)
router.use(authenticate);

// Routes for user to manage their own profile
router.get("/me", authenticate, userController.getMyProfile);
router.put(
  "/me",
  validate(validators.updateUserSchema),
  userController.updateMyProfile
);
router.patch(
  "/me/address",
  validate(validators.addressSchema),
  userController.updateMyAddress
);
router.patch(
  "/me/preferences",
  validate(validators.preferencesSchema),
  userController.updateMyPreferences
);
router.patch(
  "/me/profile-image",
  validate(validators.profileImageSchema),
  userController.updateMyProfileImage
);

// Admin routes for user management
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put(
  "/:id",
  validate(validators.updateUserSchema),
  userController.updateUserById
);
router.patch(
  "/:id/address",
  validate(validators.addressSchema),
  userController.updateUserAddress
);
router.patch(
  "/:id/preferences",
  validate(validators.preferencesSchema),
  userController.updateUserPreferences
);
router.patch(
  "/:id/profile-image",
  validate(validators.profileImageSchema),
  userController.updateUserProfileImage
);
router.delete("/:id", userController.deleteUser);

export default router;
