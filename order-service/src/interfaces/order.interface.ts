import { Document } from "mongoose";

// Order Status Type
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

// Order Item Status Type
export type OrderItemStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

// Discount Type
export type DiscountType = "percentage" | "fixed";

// Order interfaces
export interface IOrderItem extends Document {
  _id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  discountType: DiscountType;
  gstAmount: number;
  status: OrderItemStatus;
}

export interface IStatusLog extends Document {
  _id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
  comment?: string;
  userId?: string;
}

export interface IOrder extends Document {
  _id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  discountType: DiscountType;
  gstNumber: string;
  gstAmount: number;
  finalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request DTOs
export interface CreateOrderDto {
  userId: string;
  cartId?: string;
  items?: CreateOrderItemDto[];
  discountAmount?: number;
  discountType?: DiscountType;
  gstNumber?: string;
  currency?: string;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  comment?: string;
  userId?: string;
}

export interface UpdateOrderItemDto {
  quantity?: number;
  status?: OrderItemStatus;
}

export interface ApplyDiscountDto {
  discountAmount: number;
  discountType: DiscountType;
}

// Response DTOs
export interface OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  discountType: DiscountType;
  gstAmount: number;
  subtotal: number;
  status: OrderItemStatus;
}

export interface StatusLogDto {
  status: OrderStatus;
  timestamp: Date;
  comment?: string;
}

export interface OrderResponseDto {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  discountType: DiscountType;
  gstNumber: string;
  gstAmount: number;
  finalAmount: number;
  currency: string;
  createdAt: Date;
  items?: OrderItemResponseDto[];
  statusLog?: StatusLogDto[];
}

export interface OrdersListResponseDto {
  orders: OrderResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Query params
export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  sort?: string;
}

// External service DTOs
export interface ProductDto {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  availableStock: number;
  discountAmount?: number;
  discountType?: string;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
}

export interface CartItemDto {
  id: string;
  productId: string;
  quantity: number;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}
