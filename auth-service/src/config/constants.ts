export const AUTH_PROVIDERS = {
  EMAIL: "email",
  GOOGLE: "google",
  APPLE: "apple",
  FACEBOOK: "facebook",
};

export const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
  VERIFICATION: "verification",
  RESET_PASSWORD: "reset_password",
};

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid credentials",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  ACCOUNT_DEACTIVATED: "Account is deactivated",
  INVALID_TOKEN: "Invalid or expired token",
  TOKEN_REQUIRED: "Token is required",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  VERIFICATION_REQUIRED: "Email verification required",
};

export const RESPONSE_MESSAGES = {
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  TOKEN_REFRESHED: "Token refreshed successfully",
  VERIFICATION_EMAIL_SENT: "Verification email sent",
};
