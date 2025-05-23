export const RESPONSE_MESSAGES = {
  ORDER_CREATED: "Order created successfully",
  ORDER_UPDATED: "Order updated successfully",
  ORDER_CANCELLED: "Order cancelled successfully",
  ORDER_ITEM_CANCELLED: "Order item cancelled successfully",
  ORDER_ITEM_UPDATED: "Order item updated successfully",
  ORDER_ITEM_DELETED: "Order item deleted successfully",
  DISCOUNT_APPLIED: "Discount applied successfully",
  ORDERS_SEEDED: "Orders seeded successfully",
};

export const ORDER_ERRORS = {
  ORDER_NOT_FOUND: "Order not found",
  ORDER_ITEM_NOT_FOUND: "Order item not found",
  INVALID_ORDER_STATUS: "Invalid order status",
  INVALID_DISCOUNT: "Invalid discount",
  CANNOT_CANCEL_ORDER: "Cannot cancel order in current status",
  CANNOT_UPDATE_ORDER: "Cannot update order in current status",
  FORBIDDEN: "You do not have permission to perform this action",
  CART_NOT_FOUND: "Cart not found",
  CART_EMPTY: "Cart is empty",
  PRODUCT_NOT_AVAILABLE: "Product is not available in the requested quantity",
};

export const ORDER_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export const ORDER_ITEM_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  SORT: "-createdAt",
};
