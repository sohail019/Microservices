import mongoose, { Schema } from "mongoose";
import {
  IOrder,
  IOrderItem,
  OrderStatus,
  OrderItemStatus,
  DiscountType,
} from "../interfaces/order.interface";
import {
  ORDER_STATUSES,
  ORDER_ITEM_STATUSES,
  DISCOUNT_TYPES,
} from "../config/constants";

// Order Item Schema
const OrderItemSchema: Schema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.FIXED,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_ITEM_STATUSES),
      default: ORDER_ITEM_STATUSES.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Order Schema
const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.FIXED,
    },
    gstNumber: {
      type: String,
      default: "",
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: 1 });

OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ productId: 1 });
OrderItemSchema.index({ status: 1 });

// Create models
export const Order = mongoose.model<IOrder>("Order", OrderSchema);
export const OrderItem = mongoose.model<IOrderItem>(
  "OrderItem",
  OrderItemSchema
);
