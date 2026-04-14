import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { store } from './store/store';
import App from './App.tsx';
import './index.css';
import { expandTelegramWebApp, isTelegramMiniApp } from './utils/telegramWebApp';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress errors from third-party scripts (like Smartsupp Google Analytics)
  const errorMessage = event.reason?.message || '';
  if (errorMessage.includes('visitorResponded') || 
      errorMessage.includes('googleAnalytics') ||
      errorMessage.includes('Cannot set properties of undefined')) {
    event.preventDefault();
    console.warn('Suppressed third-party script error:', event.reason);
    return;
  }
  // Let other errors through normally
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  // Suppress errors from third-party scripts
  const errorMessage = event.message || '';
  if (errorMessage.includes('visitorResponded') || 
      errorMessage.includes('googleAnalytics') ||
      errorMessage.includes('Cannot set properties of undefined')) {
    event.preventDefault();
    console.warn('Suppressed third-party script error:', event.error);
    return;
  }
  // Let other errors through normally
});

// Initialize and validate user from localStorage if token exists
const initializeAuth = async () => {
  try {
    const AUTH_INIT_TIMEOUT_MS = 4000;
    const isMiniApp = isTelegramMiniApp();
    if (isMiniApp) {
      expandTelegramWebApp();
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      return;
    }

    let cachedUser: any = null;
    try {
      cachedUser = JSON.parse(userStr);
    } catch (_error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      store.dispatch({
        type: 'auth/logout',
      });
      return;
    }

    // Fast restore from localStorage so Mini App doesn't hang on spinner.
    if (cachedUser?.role === 'user' && !isMiniApp) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      store.dispatch({
        type: 'auth/logout',
      });
      return;
    }

    store.dispatch({
      type: 'auth/setCredentials',
      payload: { user: cachedUser, token },
    });

    // Validate in background with timeout; don't block app startup.
    try {
      const { authService } = await import('./services/api/authService');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth init timeout')), AUTH_INIT_TIMEOUT_MS)
      );
      const user = (await Promise.race([authService.getCurrentUser(), timeoutPromise])) as any;

      if (user.role === 'user' && !isMiniApp) {
        throw new Error('User dashboard must be accessed through Telegram Mini App');
      }

      store.dispatch({
        type: 'auth/updateUser',
        payload: user,
      });
    } catch (error: any) {
      // Keep cached session on timeout/network failures to prevent startup lock.
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      const isTimeout = errorCode === 'ECONNABORTED' || errorMessage.includes('timeout');
      const isNetworkError = errorCode === 'ERR_NETWORK';

      if (isTimeout || isNetworkError) {
        console.warn('Auth validation skipped during startup:', errorMessage || errorCode);
        return;
      }

      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      store.dispatch({
        type: 'auth/logout',
      });
    }
  } catch (error) {
    console.error('Auth bootstrap failed:', error);
  } finally {
    store.dispatch({
      type: 'auth/setLoading',
      payload: false,
    });
  }
};

// Initialize auth before rendering
initializeAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 99999,
          pointerEvents: 'none',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '16px',
            pointerEvents: 'auto',
            touchAction: 'auto',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {(bar) => (
              <div className="flex items-center gap-2 w-full pointer-events-auto">
                <div className="flex-1">{bar.message}</div>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="text-gray-500 hover:text-gray-800 text-sm font-semibold px-2 py-1"
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </Provider>
  </StrictMode>
);
