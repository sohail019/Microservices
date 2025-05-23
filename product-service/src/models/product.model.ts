import mongoose, { Schema } from "mongoose";
import { IProduct } from "../interfaces/product.interface";

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ["g", "kg", "oz", "lb"],
      default: "g",
    },
    categoryId: {
      type: String,
    },
    brandId: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    thumbnailImage: {
      type: String,
    },
    userId: {
      type: String,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Create indexes for better query performance
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ price: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ userId: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isAvailable: 1 });

// Helper to create a slug from product name
ProductSchema.statics.generateSlug = function (name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const Product = mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
