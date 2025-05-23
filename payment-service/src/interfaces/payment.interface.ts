import { Document } from "mongoose";

// Status, Method, Type, and Gateway Types
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "upi"
  | "net_banking"
  | "wallet"
  | "cash_on_delivery"
  | "other";

export type PaymentType = "full" | "partial" | "installment";

export type PaymentGateway =
  | "stripe"
  | "razorpay"
  | "paypal"
  | "manual"
  | "other";

// Database Document Interfaces
export interface IRefundDetails {
  amount: number;
  reason: string;
  reference: string;
  createdAt: Date;
}

export interface IPayment extends Document {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentType: PaymentType;
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  refundDetails: IRefundDetails[];
  createdAt: Date;
  updatedAt: Date;
  gateway_response?: any;
}

// Request DTOs
export interface InitiatePaymentDto {
  orderId: string;
  amount?: number; // Optional, if not provided get from order
  currency?: string; // Optional, if not provided default to USD
  method: PaymentMethod;
  paymentType?: PaymentType;
  gateway: PaymentGateway;
  metadata?: Record<string, any>;
  returnUrl?: string; // For redirect-based payment flows
}

export interface WebhookDto {
  event: string;
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  data: any; // Gateway-specific data
}

export interface RefundPaymentDto {
  amount?: number; // If not specified, refund entire amount
  reason: string;
}

// Response DTOs
export interface PaymentResponseDto {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentType: PaymentType;
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  status: PaymentStatus;
  refundDetails?: IRefundDetails[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInitiationResponseDto {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  redirectUrl?: string; // Redirect URL for payment gateway
  gatewayData?: Record<string, any>; // Additional data from the gateway
}

export interface PaymentListResponseDto {
  payments: PaymentResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Query params
export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  gateway?: PaymentGateway;
  startDate?: Date;
  endDate?: Date;
  sort?: string;
}

// External service interfaces
export interface OrderDto {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  finalAmount: number;
  currency: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
}
