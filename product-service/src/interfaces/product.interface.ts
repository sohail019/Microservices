import { Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  quantity: number;
  isAvailable: boolean;
  weight?: number;
  weightUnit?: string;
  categoryId?: string;
  brandId?: string;
  tags?: string[];
  images: string[];
  thumbnailImage?: string;
  userId?: string; // Owner/seller reference
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Request DTOs
export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  quantity?: number;
  isAvailable?: boolean;
  weight?: number;
  weightUnit?: string;
  categoryId?: string;
  brandId?: string;
  tags?: string[];
  images?: string[];
  thumbnailImage?: string;
  userId?: string;
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  quantity?: number;
  isAvailable?: boolean;
  weight?: number;
  weightUnit?: string;
  categoryId?: string;
  brandId?: string;
  tags?: string[];
  images?: string[];
  thumbnailImage?: string;
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Query parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  brand?: string;
  isAvailable?: boolean;
  tags?: string;
  userId?: string;
}

// Response DTOs
export interface ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  quantity: number;
  isAvailable: boolean;
  categoryId?: string;
  brandId?: string;
  tags: string[];
  images: string[];
  thumbnailImage?: string;
  userId?: string;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsListResponse {
  products: ProductResponseDto[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
