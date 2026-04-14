import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { isTelegramMiniApp } from '../../utils/telegramWebApp';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireTelegramMiniApp?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireTelegramMiniApp = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  // Wait for auth initialization to complete
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (requireAdmin) {
      if (!isTelegramMiniApp()) {
        return <Navigate to="/miniapp-required" replace />;
      }
      return <Navigate to="/login" replace />;
    }
    if (requireTelegramMiniApp && !isTelegramMiniApp()) {
      return <Navigate to="/miniapp-required" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Redirect admin users away from user routes (when requireAdmin is false)
  if (!requireAdmin && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect non-admin users away from admin routes
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  // Admin routes are Mini App only.
  if (requireAdmin && !isTelegramMiniApp()) {
    return <Navigate to="/miniapp-required" replace />;
  }

  // Check email verification for regular users (not admins)
  if (user && user.role === 'user' && !requireAdmin) {
    if (requireTelegramMiniApp && !isTelegramMiniApp()) {
      return <Navigate to="/miniapp-required" replace />;
    }

    // If email is not verified, redirect to verification required page
    if (user.isEmailVerified === false) {
      return <Navigate to={`/verification-required?email=${encodeURIComponent(user.email)}`} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
