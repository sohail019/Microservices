import mongoose, { Schema } from "mongoose";
import {
  IPayment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  PaymentGateway,
} from "../interfaces/payment.interface";
import {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PAYMENT_GATEWAYS,
} from "../config/constants";

// Refund Details Schema
const RefundDetailsSchema: Schema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Payment Schema
const PaymentSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
    },
    paymentType: {
      type: String,
      enum: Object.values(PAYMENT_TYPES),
      default: PAYMENT_TYPES.FULL,
    },
    gateway: {
      type: String,
      enum: Object.values(PAYMENT_GATEWAYS),
      required: true,
    },
    gatewayPaymentId: {
      type: String,
      sparse: true, // Allow null/undefined but ensure uniqueness if provided
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    refundDetails: [RefundDetailsSchema],
    gateway_response: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
PaymentSchema.index({ gatewayPaymentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: 1 });

export default mongoose.model<IPayment>("Payment", PaymentSchema);
