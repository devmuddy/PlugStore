import apiClient from './axios';
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '../../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
      return response.data.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  loginAdmin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login-admin', credentials);
      return response.data.data;
    } catch (error: any) {
      console.error('Admin login API error:', error);
      throw error;
    }
  },

  loginWithTelegramMiniApp: async (initData: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/telegram-miniapp-login', { initData });
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/forgot-password', { email });
    return response.data.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/reset-password', {
      token,
      password,
    });
    return response.data.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/verify-email', { token });
    return response.data.data;
  },

  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/resend-verification', { email });
    return response.data.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/auth/me');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/logout');
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      console.error('Logout API error:', error);
      // Don't throw - we'll clear local storage anyway
    }
  },
};

export default authService;
