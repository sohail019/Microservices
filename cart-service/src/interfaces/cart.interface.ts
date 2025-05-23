import { Document } from "mongoose";

export interface ICartItem extends Document {
  productId: string;
  quantity: number;
  status: string;
  addedAt: Date;
}

export interface ICart extends Document {
  userId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Request DTOs
export interface AddToCartDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity?: number;
  status?: string;
}

// Response DTOs
export interface CartItemResponseDto {
  id: string;
  productId: string;
  quantity: number;
  status: string;
  addedAt: Date;
}

export interface CartSummaryDto {
  totalItems: number;
  subtotal: number;
}

export interface CartResponseDto {
  id: string;
  userId: string;
  items: CartItemResponseDto[];
  summary: CartSummaryDto;
  createdAt: Date;
  updatedAt: Date;
}

// Product DTOs for cross-service communication
export interface ProductDto {
  id: string;
  name: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  quantity: number;
  images?: string[];
  thumbnailImage?: string;
}

// Enhanced cart with product details
export interface CartItemWithProductDto {
  id: string;
  productId: string;
  quantity: number;
  status: string;
  addedAt: Date;
  product?: ProductDto;
}

export interface CartWithProductsDto {
  id: string;
  userId: string;
  items: CartItemWithProductDto[];
  summary: CartSummaryDto & {
    totalProducts: number;
    unavailableItems: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
