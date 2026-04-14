import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import { isTelegramMiniApp } from './utils/telegramWebApp';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

// Pages
import MiniAppRequired from './pages/public/MiniAppRequired';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/user/Dashboard';
import Products from './pages/user/Products';
import Orders from './pages/user/Orders';
import Deposits from './pages/user/Deposits';
import Transactions from './pages/user/Transactions';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/Products';
import AdminUsers from './pages/admin/Users';
import AdminWallet from './pages/admin/Wallet';
import AdminDeposits from './pages/admin/Deposits';
import AdminOrders from './pages/admin/Orders';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const isMiniApp = isTelegramMiniApp();

  // Helper function to get the correct dashboard route based on user role
  const getDashboardRoute = () => {
    if (user?.role === 'admin') {
      return '/admin/dashboard';
    }
    return '/user/dashboard';
  };

  // Show loading state during auth initialization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to={isMiniApp ? '/login' : '/miniapp-required'} replace />} />
        
        {/* Redirect old routes to new routes */}
        <Route path="/dashboard" element={<Navigate to="/miniapp-required" replace />} />
        <Route path="/products" element={<Navigate to="/miniapp-required" replace />} />
        <Route path="/orders" element={<Navigate to="/miniapp-required" replace />} />
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route path="/miniapp-required" element={<MiniAppRequired />} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={
              isMiniApp
                ? (isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : <Login />)
                : <Navigate to="/miniapp-required" replace />
            }
          />
          <Route
            path="/admin/login"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/register"
            element={
              isMiniApp
                ? (isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : <Register />)
                : <Navigate to="/miniapp-required" replace />
            }
          />
          <Route
            path="/forgot-password"
            element={isMiniApp ? <ForgotPassword /> : <Navigate to="/miniapp-required" replace />}
          />
        </Route>

        {/* User Routes */}
        <Route element={<UserLayout />}>
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute requireTelegramMiniApp>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/products"
            element={
              <ProtectedRoute requireTelegramMiniApp>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/orders"
            element={
              <ProtectedRoute requireTelegramMiniApp>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/deposits"
            element={
              <ProtectedRoute requireTelegramMiniApp>
                <Deposits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/transactions"
            element={
              <ProtectedRoute requireTelegramMiniApp>
                <Transactions />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wallet"
            element={
              <ProtectedRoute requireAdmin>
                <AdminWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/deposits"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDeposits />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
