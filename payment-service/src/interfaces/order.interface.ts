export interface Order {
  _id: string;
  userId: string;
  totalAmount: number;
  finalAmount?: number;
  currency?: string;
  status: string; // e.g., "pending", "completed", "cancelled"
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string;
    quantity: number;
    price: number; // Price per item
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Add any other properties that your Order needs
}
