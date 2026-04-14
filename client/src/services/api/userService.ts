import apiClient from './axios';
import type { ApiResponse } from '../../types';

export interface Transaction {
  id: string;
  type: 'deposit' | 'order' | 'credit' | 'debit';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'delivered' | 'cancelled' | 'completed';
  createdAt: string;
  transactionHash?: string;
  productName?: string;
  description?: string;
}

export interface BalanceResponse {
  balance: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  productName: string;
  category: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  quantity: number;
  deliveryInfo?: {
    key?: string;
    username?: string;
    password?: string;
    email?: string;
    additionalInfo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserOrdersResponse {
  orders: UserOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  categoryName: string;
  subCategoryId: string | null;
  subCategoryName: string | null;
  image?: string;
  stock: number;
  balance?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

export interface PurchaseProductRequest {
  productId: string;
  quantity?: number;
}

export interface PurchaseProductResponse {
  id: string;
  orderNumber: string;
  productName: string;
  category: string;
  amount: number;
  quantity: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getBalance: async (): Promise<number> => {
    try {
      const response = await apiClient.get<ApiResponse<BalanceResponse>>('/api/user/balance');
      return response.data.data.balance;
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
      throw error;
    }
  },

  getTransactions: async (limit: number = 10): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get<ApiResponse<TransactionsResponse>>(
        `/api/user/transactions?limit=${limit}`
      );
      return response.data.data.transactions;
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  },

  getOrders: async (params?: { page?: number; limit?: number }): Promise<UserOrdersResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await apiClient.get<ApiResponse<UserOrdersResponse>>(
        `/api/user/orders?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  },

  getOrderById: async (id: string): Promise<UserOrder> => {
    try {
      const response = await apiClient.get<ApiResponse<UserOrder>>(`/api/user/orders/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },

  getProducts: async (params?: { category?: string; subCategory?: string; search?: string }): Promise<ProductsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
      if (params?.search) queryParams.append('search', params.search);
      
      const response = await apiClient.get<ApiResponse<ProductsResponse>>(
        `/api/user/products?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  purchaseProduct: async (data: PurchaseProductRequest): Promise<PurchaseProductResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<PurchaseProductResponse>>(
        '/api/user/orders',
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to purchase product:', error);
      throw error;
    }
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const response = await apiClient.get<ApiResponse<PaymentMethod[]>>('/api/user/payment-methods');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  },

  createDeposit: async (data: CreateDepositRequest): Promise<CreateDepositResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<CreateDepositResponse>>(
        '/api/user/deposits',
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create deposit:', error);
      throw error;
    }
  },
};

export interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  walletAddress: string;
  icon?: string;
  qrCode?: string;
  minDeposit?: number;
  maxDeposit?: number;
}

export interface CreateDepositRequest {
  paymentMethodId: string;
  amount: number;
  transactionId: string;
}

export interface CreateDepositResponse {
  id: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  transactionId: string;
  createdAt: string;
}

export default userService;

