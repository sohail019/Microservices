import mongoose, { Schema } from "mongoose";
import { ICart, ICartItem } from "../interfaces/cart.interface";
import { CART_ITEM_STATUS } from "../config/constants";

const CartItemSchema: Schema = new Schema({
  productId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: [
      CART_ITEM_STATUS.ACTIVE,
      CART_ITEM_STATUS.SAVED_FOR_LATER,
      CART_ITEM_STATUS.REMOVED,
    ],
    default: CART_ITEM_STATUS.ACTIVE,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CartSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: [CartItemSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
CartSchema.index({ userId: 1 });
CartSchema.index({ "items.productId": 1 });

export const CartModel = mongoose.model<ICart>("Cart", CartSchema);
export const CartItemModel = mongoose.model<ICartItem>(
  "CartItem",
  CartItemSchema
);

export default CartModel;
