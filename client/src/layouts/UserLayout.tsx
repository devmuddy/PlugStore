import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import { authService } from '../services/api/authService';
import { env } from '../config/env';
import { categoryService, type Category } from '../services/api/categoryService';
import { initSupportWidget, showSupportWidget, hideSupportWidget } from '../utils/supportWidget';
import { HiLogout } from 'react-icons/hi';
import { MdAccountBalanceWallet } from 'react-icons/md';
import DepositDrawer from '../components/user/DepositDrawer';

const UserLayout = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [productsDrawerOpen, setProductsDrawerOpen] = useState(false);
  const [depositDrawerOpen, setDepositDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingCategories(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await categoryService.getCategories();
        setCategories(data);
        if (data.length > 0) {
          setExpandedCategories(new Set([data[0].id]));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isAuthenticated]);

  useEffect(() => {
    initSupportWidget();
    showSupportWidget();

    // Re-assert visibility after async script boot to avoid missed initial show.
    const retryTimer = window.setTimeout(() => {
      showSupportWidget();
    }, 1200);

    return () => {
      window.clearTimeout(retryTimer);
      hideSupportWidget();
    };
  }, []);

  useEffect(() => {
    const openProductsDrawer = () => setProductsDrawerOpen(true);
    const openDepositDrawer  = () => setDepositDrawerOpen(true);

    window.addEventListener('open-products-drawer', openProductsDrawer);
    window.addEventListener('open-deposit-drawer',  openDepositDrawer);
    return () => {
      window.removeEventListener('open-products-drawer', openProductsDrawer);
      window.removeEventListener('open-deposit-drawer',  openDepositDrawer);
    };
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
      navigate('/login');
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/user/products?category=${categoryId}`);
    setProductsDrawerOpen(false);
  };

  const handleSubCategoryClick = (categoryId: string, subCategoryId: string) => {
    navigate(`/user/products?category=${categoryId}&subCategory=${subCategoryId}`);
    setProductsDrawerOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/user/dashboard') {
      return location.pathname === '/user/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {productsDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setProductsDrawerOpen(false)}
        />
      )}

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-80 bg-gradient-to-b from-primary-800 via-primary-700 to-primary-800 shadow-2xl">
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between h-20 px-6 border-b border-primary-600/30">
            <Link
              to="/user/dashboard"
              className="flex items-center space-x-2 text-xl font-bold text-white hover:text-primary-200 transition-colors"
            >
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-base font-bold text-white">{env.appName.charAt(0).toUpperCase()}</span>
              </div>
              <span>{env.appName}</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
            <Link
              to="/user/dashboard"
              className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive('/user/dashboard')
                  ? 'bg-white/20 text-white shadow-lg border-l-4 border-l-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white border-l-4 border-l-transparent'
              }`}
            >
              <MdAccountBalanceWallet className={`mr-3 w-5 h-5 ${isActive('/user/dashboard') ? 'text-white' : 'text-white/70'}`} />
              Wallet
            </Link>

            <div className="pt-2">
              <div className="px-4 mb-3">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Categories</h3>
              </div>
              {isLoadingCategories ? (
                <div className="px-4 py-3 text-sm text-white/60">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/60">No categories available</div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => {
                    const isExpanded = expandedCategories.has(category.id);
                    return (
                      <div key={category.id} className="space-y-1">
                        <div className="bg-white/5 border border-white/10">
                          <button
                            onClick={() => {
                              toggleCategory(category.id);
                              if (!isExpanded && category.subCategories.length === 0) {
                                handleCategoryClick(category.id);
                              }
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-200 text-white hover:bg-white/10 group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-white/40 group-hover:bg-white/70 transition-colors"></div>
                              <span className="text-left truncate">{category.name}</span>
                            </div>
                            {category.subCategories.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5">
                                  {category.subCategories.length}
                                </span>
                                <span className={`text-xs text-white/60 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                  ▶
                                </span>
                              </div>
                            )}
                          </button>

                          {isExpanded && category.subCategories.length > 0 && (
                            <div className="bg-white/5 border-t border-white/10">
                              {category.subCategories.map((subCategory) => (
                                <button
                                  key={subCategory.id}
                                  onClick={() => handleSubCategoryClick(category.id, subCategory.id)}
                                  className="w-full text-left px-8 py-2.5 text-xs font-medium transition-all duration-200 text-white/70 hover:bg-white/10 hover:text-white flex items-center space-x-2"
                                >
                                  <span className="w-1 h-1 bg-white/40"></span>
                                  <span>{subCategory.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="p-6 border-t border-primary-600/30 bg-primary-900/50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <span className="text-white font-semibold text-sm">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email || 'User'}</p>
                <p className="text-xs text-white/60 truncate">Member</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-80">
        <nav className="bg-white sticky top-0 z-20" style={{ borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          {/* Blue accent top line */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)' }} />
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div>
                <p className="text-[11px] text-gray-400 font-light tracking-wide">Welcome back</p>
                <h2 className="auth-heading text-sm font-bold text-gray-900 leading-tight">
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </h2>
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

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <aside
        className={`lg:hidden fixed top-0 right-0 h-full w-[88vw] max-w-sm z-40 bg-white shadow-2xl transform transition-transform duration-300 rounded-l-2xl ${
          productsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="px-5 pt-4 pb-4 rounded-tl-2xl" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="auth-heading text-base font-bold text-gray-900">Products</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {isLoadingCategories ? 'Loading…' : `${categories.length} categories`}
                </p>
              </div>
              <button
                onClick={() => setProductsDrawerOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Category list */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {isLoadingCategories ? (
              <div className="p-5 space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 h-3 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-5 py-16 text-center text-sm text-gray-400">No categories available</div>
            ) : (
              <div className="px-5 py-3">
                {categories.map((category, catIndex) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const initials = category.name.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase();
                  return (
                    <div key={category.id}>
                      {/* Category row */}
                      <button
                        onClick={() => {
                          toggleCategory(category.id);
                          if (!isExpanded && category.subCategories.length === 0) {
                            handleCategoryClick(category.id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 py-3 text-left transition-colors group ${
                          catIndex !== categories.length - 1 && !isExpanded ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {/* Initial badge */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isExpanded ? 'bg-primary-600' : 'bg-primary-50'
                        }`}>
                          <span className={`text-[10px] font-bold ${isExpanded ? 'text-white' : 'text-primary-600'}`}>
                            {initials}
                          </span>
                        </div>

                        {/* Name */}
                        <span className={`flex-1 text-sm font-semibold truncate transition-colors ${
                          isExpanded ? 'text-primary-600' : 'text-gray-800 group-hover:text-gray-900'
                        }`}>
                          {category.name}
                        </span>

                        {/* Badge + chevron */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {category.subCategories.length > 0 && (
                            <span className="text-[10px] font-semibold text-gray-400">
                              {category.subCategories.length}
                            </span>
                          )}
                          <span className={`text-xs text-gray-300 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}>
                            ›
                          </span>
                        </div>
                      </button>

                      {/* Subcategories */}
                      {isExpanded && category.subCategories.length > 0 && (
                        <div className="mb-1 border-b border-gray-100">
                          {category.subCategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleSubCategoryClick(category.id, sub.id)}
                              className="w-full flex items-center gap-3 pl-11 pr-2 py-2.5 text-left hover:bg-primary-50 transition-colors group"
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-primary-400 transition-colors shrink-0" />
                              <span className="text-xs font-medium text-gray-500 group-hover:text-primary-600 transition-colors truncate">
                                {sub.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </aside>

      <DepositDrawer open={depositDrawerOpen} onClose={() => setDepositDrawerOpen(false)} />
    </div>
  );
};

export default UserLayout;
