import mongoose, { Document, Schema } from "mongoose";

interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  final_amount: number;
  currency: string;
  status: string;
  gst_number?: string;
  gst_amount?: number;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    final_amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: { type: String, required: true, default: "pending" },
    gst_number: { type: String },
    gst_amount: { type: Number },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
