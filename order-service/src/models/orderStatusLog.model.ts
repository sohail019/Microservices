import mongoose, { Schema } from "mongoose";
import { IStatusLog, OrderStatus } from "../interfaces/order.interface";
import { ORDER_STATUSES } from "../config/constants";

// Status Log Schema
const OrderStatusLogSchema: Schema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      default: "",
    },
    userId: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

// Create indexes for better performance
OrderStatusLogSchema.index({ orderId: 1 });
OrderStatusLogSchema.index({ timestamp: 1 });

export const OrderStatusLog = mongoose.model<IStatusLog>(
  "OrderStatusLog",
  OrderStatusLogSchema
);
