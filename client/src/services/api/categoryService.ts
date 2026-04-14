import apiClient from './axios';
import type { ApiResponse } from '../../types';

export interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    // Check if user is authenticated before making request
    const token = localStorage.getItem('token');
    if (!token) {
      // Return empty array if not authenticated
      return [];
    }

    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/api/user/categories');
      return response.data.data;
    } catch (error: any) {
      // Only log error if it's not a 401 (unauthorized) - those are handled by axios interceptor
      if (error.response?.status !== 401) {
        console.error('Failed to fetch categories:', error);
      }
      // Return empty array on error instead of mock data
      return [];
    }
  },
};

export default categoryService;

