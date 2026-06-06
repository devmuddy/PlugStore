import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import { authService } from '../services/api/authService';
import { env } from '../config/env';
import { hideSupportWidget } from '../utils/supportWidget';
import { 
  HiOutlineChartBar, 
  HiOutlineCube, 
  HiOutlineShoppingCart, 
  HiOutlineUsers, 
  HiOutlineCash,
  HiX,
  HiMenu,
  HiLogout
} from 'react-icons/hi';
import { MdAccountBalanceWallet } from 'react-icons/md';

const AdminLayout = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    hideSupportWidget();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      navigate('/admin/login');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HiOutlineChartBar },
    { name: 'Products', href: '/admin/products', icon: HiOutlineCube },
    { name: 'Orders', href: '/admin/orders', icon: HiOutlineShoppingCart },
    { name: 'Users', href: '/admin/users', icon: HiOutlineUsers },
    { name: 'Wallet', href: '/admin/wallet', icon: MdAccountBalanceWallet },
    { name: 'Deposits', href: '/admin/deposits', icon: HiOutlineCash },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[76vw] max-w-xs lg:w-64 bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 pt-3 pb-4 border-b border-gray-200 bg-white">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 lg:hidden" />
            <div className="flex items-center justify-between">
              <Link to="/admin/dashboard" className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-primary-700 transition-colors">
                <div className="w-8 h-8 bg-primary-50 border border-primary-100 flex items-center justify-center rounded-lg">
                  <span className="text-base font-bold text-primary-700">{env.appName.charAt(0).toUpperCase()}</span>
                </div>
                <span>{env.appName}</span>
              </Link>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Navigation</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl border transition-all duration-200 ${
                    active
                      ? 'border-primary-200 bg-primary-50 text-primary-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50/40'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`mr-3 w-5 h-5 ${active ? 'text-primary-700' : 'text-gray-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  <span className={`text-xs ${active ? 'text-primary-500' : 'text-gray-300'}`}>›</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/70">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-50 border border-primary-100 flex items-center justify-center rounded-lg">
                  <span className="text-primary-700 font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <nav className="bg-white sticky top-0 z-20" style={{ borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #dc2626, #f87171, #dc2626)' }} />
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <HiMenu className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-[11px] text-gray-400 font-light tracking-wide">Welcome back</p>
                  <h2 className="auth-heading text-sm font-bold text-gray-900 leading-tight">
                    {user?.username || user?.email?.split('@')[0] || 'Admin'}
                  </h2>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <HiLogout className="w-3.5 h-3.5" />
                )}
                <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Content area */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
