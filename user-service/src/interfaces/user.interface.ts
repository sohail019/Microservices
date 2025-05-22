import { Document } from "mongoose";

export interface IUser extends Document {
  authId: string; // Reference to Auth service's user ID
  fullName: string;
  email: string;
  phone: string;
  profileImage: string;
  dateOfBirth: Date | null;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request DTOs
export interface CreateUserDto {
  authId: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: Date | string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: Date | string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
}

export interface UpdateAddressDto {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdatePreferencesDto {
  theme?: string;
  language?: string;
  notifications?: boolean;
}

// Response DTOs
export interface UserResponseDto {
  id: string;
  authId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string;
  dateOfBirth: Date | null;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Query Params
export interface UserQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  isProfileComplete?: boolean;
}
