import axios from 'axios';
import { env } from '../../config/env';
import { getTelegramInitData, isTelegramMiniApp } from '../../utils/telegramWebApp';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as { role?: 'user' | 'admin' };
        if (parsedUser.role === 'user') {
          const initData = getTelegramInitData();
          if (initData) {
            config.headers['x-telegram-init-data'] = initData;
          }
        }
      } catch (_error) {
        // Ignore malformed localStorage user payload.
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 for protected routes, not for login/register endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const errorMessage = error.response?.data?.message || 'Session expired or invalid';
      const hasToken = Boolean(localStorage.getItem('token'));
      const shouldForceLogout =
        /session invalidated|session expired|invalid or expired token|expired or invalid/i.test(
          errorMessage
        ) || !hasToken;
      const storedUser = localStorage.getItem('user');
      let currentRole: 'user' | 'admin' | null = null;
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as { role?: 'user' | 'admin' };
          currentRole = parsedUser.role || null;
        } catch (_error) {
          currentRole = null;
        }
      }
      
      // Don't redirect if we're already on auth endpoints
      if (
        !url.includes('/api/auth/login') &&
        !url.includes('/api/auth/register') &&
        !url.includes('/api/auth/logout') &&
        !url.includes('/api/auth/telegram-miniapp-login')
      ) {
        if (!shouldForceLogout) {
          return Promise.reject(error);
        }

        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show user-friendly message if session was invalidated
        if (errorMessage.includes('Session') || errorMessage.includes('invalidated')) {
          // Use a small delay to ensure the message is shown before redirect
          setTimeout(() => {
            if (currentRole === 'user') {
              if (isTelegramMiniApp()) {
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              } else if (window.location.pathname !== '/miniapp-required') {
                window.location.href = '/miniapp-required';
              }
              return;
            }

            if (window.location.pathname !== '/admin/login') {
              window.location.href = '/admin/login';
            }
          }, 100);
        } else {
          if (currentRole === 'user') {
            if (isTelegramMiniApp()) {
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            } else if (window.location.pathname !== '/miniapp-required') {
              window.location.href = '/miniapp-required';
            }
          } else if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
      }
    }
    
    // Log network errors (but not for 401s on auth endpoints)
    if (!error.response) {
      const url = error.config?.url || '';
      // Don't log network errors for auth endpoints or if we're redirecting
      if (!url.includes('/api/auth/')) {
        console.error('Network error:', error.message);
        if (error.code === 'ERR_NETWORK') {
          console.error('Unable to connect to server. Please check if the server is running.');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
