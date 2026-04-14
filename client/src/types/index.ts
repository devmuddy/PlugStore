// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  authProvider?: 'password' | 'telegram';
  telegramId?: string;
  telegramUsername?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  total: number;
  credentials?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
