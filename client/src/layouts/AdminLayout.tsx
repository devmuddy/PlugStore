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
        className={`fixed inset-y-0 left-0 z-40 w-[76vw] max-w-xs lg:w-64 bg-[#0a0a0a] shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar accent border */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary-600/40 via-primary-600/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <Link to="/admin/dashboard" className="flex items-center gap-3 group">
                <div className="w-9 h-9 bg-primary-600 flex items-center justify-center rounded-xl shadow-lg shadow-primary-600/25 group-hover:shadow-primary-600/40 transition-shadow">
                  <span className="text-base font-bold text-white">{env.appName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-base font-bold text-white tracking-tight">{env.appName}</span>
                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-widest">Admin Panel</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Navigation label */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Main Menu</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    active
                      ? 'text-white bg-primary-600/15 shadow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />
                  )}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                      : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="mx-3 mb-3 p-3 rounded-xl bg-white/5 border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-600/20 flex items-center justify-center">
                <span className="text-primary-400 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate leading-tight">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Logout"
              >
                {isLoggingOut ? (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <HiLogout className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <nav className="bg-white sticky top-0 z-20 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <HiMenu className="w-5 h-5" />
                </button>

                <div>
                  <p className="text-xs text-gray-400 font-light leading-tight">Hello,</p>
                  <h1 className="text-sm font-bold text-gray-900 leading-tight">
                    {user?.username || user?.email?.split('@')[0] || 'Admin'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick action buttons */}
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </button>

              <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
              </button>

              {/* User section */}
              <div className="flex items-center gap-3 pl-2.5 border-l border-gray-200">
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600">Online</span>
                </div>
              </div>
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
