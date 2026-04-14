import apiClient from './axios';
import type { ApiResponse } from '../../types';

export interface UpdateBalanceResponse {
  balance: number;
  message: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product';
  message: string;
  time: string;
}

export interface RecentOrder {
  id: string;
  orderId: string;
  product: string;
  customer: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface UserWithBalance {
  id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  isEmailVerified?: boolean;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

export const adminService = {
  updateUserBalance: async (
    userId: string,
    amount: number,
    action: 'add' | 'subtract'
  ): Promise<UpdateBalanceResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<UpdateBalanceResponse>>(
        `/api/admin/users/${userId}/balance`,
        { amount, action }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update user balance:', error);
      throw error;
    }
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  getRecentActivity: async (limit: number = 10): Promise<RecentActivity[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RecentActivity[]>>(
        `/api/admin/dashboard/recent-activity?limit=${limit}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }
  },

  getRecentOrders: async (limit: number = 10): Promise<RecentOrder[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RecentOrder[]>>(
        `/api/admin/dashboard/recent-orders?limit=${limit}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch recent orders:', error);
      throw error;
    }
  },

  getAllUsers: async (): Promise<UserWithBalance[]> => {
    try {
      const response = await apiClient.get<ApiResponse<UserWithBalance[]>>('/api/admin/users');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/api/admin/users/${userId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  getPendingDeposits: async (): Promise<Deposit[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Deposit[]>>('/api/admin/deposits/pending');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch pending deposits:', error);
      throw error;
    }
  },

  approveDeposit: async (depositId: string): Promise<{ message: string; newBalance: number }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string; newBalance: number }>>(
        `/api/admin/deposits/${depositId}/approve`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to approve deposit:', error);
      throw error;
    }
  },

  rejectDeposit: async (depositId: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `/api/admin/deposits/${depositId}/reject`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to reject deposit:', error);
      throw error;
    }
  },

  getAllPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const response = await apiClient.get<ApiResponse<PaymentMethod[]>>('/api/admin/payment-methods');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  },

  createPaymentMethod: async (formData: FormData): Promise<PaymentMethod> => {
    try {
      const response = await apiClient.post<ApiResponse<PaymentMethod>>(
        '/api/admin/payment-methods',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create payment method:', error);
      throw error;
    }
  },

  updatePaymentMethod: async (id: string, formData: FormData): Promise<PaymentMethod> => {
    try {
      const response = await apiClient.put<ApiResponse<PaymentMethod>>(
        `/api/admin/payment-methods/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update payment method:', error);
      throw error;
    }
  },

  deletePaymentMethod: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/api/admin/payment-methods/${id}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  },

  getAllOrders: async (params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<OrdersResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await apiClient.get<ApiResponse<OrdersResponse>>(
        `/api/admin/orders?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  },

  getOrderById: async (id: string): Promise<Order> => {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/api/admin/orders/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },

  updateOrderStatus: async (id: string, status: 'pending' | 'processing' | 'completed' | 'cancelled'): Promise<{ id: string; status: string; updatedAt: string }> => {
    try {
      const response = await apiClient.patch<ApiResponse<{ id: string; status: string; updatedAt: string }>>(
        `/api/admin/orders/${id}/status`,
        { status }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  },

  // Categories
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/api/admin/categories');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  },

  createCategory: async (data: { name: string; description?: string; icon?: string }): Promise<Category> => {
    try {
      const response = await apiClient.post<ApiResponse<Category>>('/api/admin/categories', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create category:', error);
      throw error;
    }
  },

  updateCategory: async (id: string, data: { name?: string; description?: string; icon?: string; isActive?: boolean }): Promise<Category> => {
    try {
      const response = await apiClient.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/admin/categories/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },

  // Subcategories
  addSubCategory: async (categoryId: string, data: { name: string }): Promise<SubCategory> => {
    try {
      const response = await apiClient.post<ApiResponse<SubCategory>>(
        `/api/admin/categories/${categoryId}/subcategories`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to add subcategory:', error);
      throw error;
    }
  },

  updateSubCategory: async (categoryId: string, subCategoryId: string, data: { name?: string; isActive?: boolean }): Promise<SubCategory> => {
    try {
      const response = await apiClient.put<ApiResponse<SubCategory>>(
        `/api/admin/categories/${categoryId}/subcategories/${subCategoryId}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update subcategory:', error);
      throw error;
    }
  },

  deleteSubCategory: async (categoryId: string, subCategoryId: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/api/admin/categories/${categoryId}/subcategories/${subCategoryId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to delete subcategory:', error);
      throw error;
    }
  },

  // Products
  getAllProducts: async (params?: { categoryId?: string; subCategoryId?: string; search?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params?.subCategoryId) queryParams.append('subCategoryId', params.subCategoryId);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await apiClient.get<ApiResponse<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>>(
        `/api/admin/products?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(`/api/admin/products/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  },

  createProduct: async (data: { name: string; description: string; price: string; balance?: string; categoryId: string; subCategoryId?: string }): Promise<Product> => {
    try {
      const response = await apiClient.post<ApiResponse<Product>>(
        '/api/admin/products',
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },

  updateProduct: async (id: string, data: { name?: string; description?: string; price?: string; balance?: string; categoryId?: string; subCategoryId?: string }): Promise<Product> => {
    try {
      const response = await apiClient.put<ApiResponse<Product>>(
        `/api/admin/products/${id}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/admin/products/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },
};

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  username?: string;
  amount: number;
  currency: string;
  transactionHash: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  walletAddress: string;
  icon?: string;
  qrCode?: string;
  minDeposit?: number;
  maxDeposit?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  username: string;
  userEmail: string;
  productName: string;
  category: string;
  subCategory?: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  quantity: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveryInfo?: {
    key?: string;
    username?: string;
    password?: string;
    email?: string;
    additionalInfo?: string;
  };
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  subCategories: SubCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  balance?: number;
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  image?: string;
  isActive: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default adminService;

