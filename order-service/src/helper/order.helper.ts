/**
 * Helper function to format order response
 */
export function formatOrderResponse(order: any): any {
  return {
    id: order._id.toString(),
    userId: order.userId,
    status: order.status,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount,
    discountType: order.discountType,
    gstNumber: order.gstNumber,
    gstAmount: order.gstAmount,
    finalAmount: order.finalAmount,
    currency: order.currency,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Helper function to format order item response
 */
export function formatOrderItemResponse(item: any): any {
  const subtotal = item.quantity * item.unitPrice;

  if (item.discountType === "percentage") {
  } else {
  }

  return {
    id: item._id.toString(),
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    discountType: item.discountType,
    gstAmount: item.gstAmount,
    subtotal,
    status: item.status,
  };
}
