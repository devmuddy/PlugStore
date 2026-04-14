import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiUsers,
  HiShoppingCart,
  HiCurrencyDollar,
  HiClock,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiArrowRight,
} from 'react-icons/hi';
import { MdAccountBalanceWallet } from 'react-icons/md';
import { adminService } from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all dashboard data in parallel
        const [statsData, ordersData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRecentOrders(10),
        ]);

        setStats(statsData);
        setNewOrders(ordersData);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
        
        // Set default values on error
        setStats({
          totalUsers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
        });
        setNewOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: HiUsers,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: HiShoppingCart,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: HiCurrencyDollar,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-50',
      change: '+15%',
      changeType: 'positive',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: HiClock,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      change: '-5%',
      changeType: 'negative',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Monitor your platform performance and manage operations
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Monitor your platform performance and manage operations
        </p>
      </div>

      {/* Stats Grid - Compact Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden bg-white rounded-xl p-3.5 sm:p-4 transition-all duration-200 border border-gray-100"
              style={{ animationDelay: `${index * 0.06}s`, animation: 'fadeInUp 0.35s ease-out forwards' }}
            >
              <div className="relative space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${card.iconBg}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
                  </div>
                  <div className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold ${
                    card.changeType === 'positive' 
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}>
                    <span>{card.changeType === 'positive' ? '↗' : '↘'}</span>
                    <span>{card.change}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {card.title}
                  </p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    {card.value}
                  </p>
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${card.iconBg} opacity-90`} />
            </div>
          );
        })}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary-600 rounded-full" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/admin/products"
            className="group relative z-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <HiOutlineCube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Manage Products</p>
                  <p className="text-xs text-primary-100 mt-0.5">Add & edit items</p>
                </div>
              </div>
              <HiArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="group relative z-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <HiOutlineShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">View Orders</p>
                  <p className="text-xs text-primary-100 mt-0.5">Track purchases</p>
                </div>
              </div>
              <HiArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="group relative z-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <HiUsers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Manage Users</p>
                  <p className="text-xs text-primary-100 mt-0.5">View customers</p>
                </div>
              </div>
              <HiArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/wallet"
            className="group relative z-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MdAccountBalanceWallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Wallet</p>
                  <p className="text-xs text-primary-100 mt-0.5">Manage finances</p>
                </div>
              </div>
              <HiArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="space-y-3 sm:space-y-4">
        {/* Header with different design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-1 h-6 sm:h-8 bg-primary-600 rounded-full" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Orders</h2>
          </div>
          <Link
            to="/admin/orders"
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs sm:text-sm font-semibold transition-all group self-start sm:self-auto"
          >
            <span>View all</span>
            <HiArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {/* Mobile optimized cards - no bg on mobile */}
        <div className="space-y-0 divide-y divide-gray-200">
          {newOrders.length > 0 ? (
            newOrders.map((order, idx) => (
              <div
                key={order.id}
                className="py-3 sm:py-4 transition-all duration-200 group"
                style={{
                  animationDelay: `${idx * 0.05}s`,
                  animation: 'fadeInUp 0.4s ease-out forwards'
                }}
              >
                {/* Mobile-first layout */}
                <div className="space-y-3">
                  {/* Top row - Order ID and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                        <HiOutlineShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{order.orderId}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">Order ID</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] font-semibold rounded-md flex-shrink-0 ${
                        order.status === 'pending'
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                          : order.status === 'processing'
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                          : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  
                  {/* Middle row - Product and Amount */}
                  <div className="flex items-center justify-between gap-3 pl-10 sm:pl-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 truncate">{order.product}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">${order.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Bottom row - Customer (hidden on mobile, shown on md+) */}
                  <div className="hidden md:flex items-center gap-2 pl-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer:</p>
                    <p className="text-xs sm:text-sm text-gray-700">{order.customer}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <HiOutlineShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-700">No new orders yet</p>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">Orders will appear here in real-time when customers place them</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
