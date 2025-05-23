export const RESPONSE_MESSAGES = {
  PAYMENT_INITIATED: "Payment initiated successfully",
  PAYMENT_COMPLETED: "Payment completed successfully",
  PAYMENT_FAILED: "Payment failed",
  PAYMENT_CANCELLED: "Payment cancelled",
  PAYMENT_REFUNDED: "Payment refunded successfully",
  WEBHOOK_PROCESSED: "Webhook processed successfully",
  PAYMENTS_SEEDED: "Payments seeded successfully",
};

export const PAYMENT_ERRORS = {
  PAYMENT_NOT_FOUND: "Payment not found",
  PAYMENT_ALREADY_PROCESSED: "Payment already processed",
  INVALID_PAYMENT_STATUS: "Invalid payment status",
  INVALID_AMOUNT: "Invalid amount",
  PAYMENT_GATEWAY_ERROR: "Payment gateway error",
  CANNOT_REFUND: "Cannot refund this payment",
  CANNOT_CANCEL: "Cannot cancel this payment",
  ORDER_NOT_FOUND: "Order not found",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "You don't have permission to access this resource",
  INVALID_WEBHOOK: "Invalid webhook payload",
};

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};

export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  UPI: "upi",
  NET_BANKING: "net_banking",
  WALLET: "wallet",
  CASH_ON_DELIVERY: "cash_on_delivery",
  OTHER: "other",
};

export const PAYMENT_TYPES = {
  FULL: "full",
  PARTIAL: "partial",
  INSTALLMENT: "installment",
};

export const PAYMENT_GATEWAYS = {
  STRIPE: "stripe",
  RAZORPAY: "razorpay",
  PAYPAL: "paypal",
  MANUAL: "manual",
  OTHER: "other",
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  SORT: "-createdAt",
};
