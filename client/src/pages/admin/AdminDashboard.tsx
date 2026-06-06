import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiUsers,
  HiShoppingCart,
  HiCurrencyDollar,
  HiClock,
  HiOutlineShoppingCart,
  HiOutlineCube,
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
      iconColor: 'text-primary-600',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: HiShoppingCart,
      iconColor: 'text-primary-600',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: HiCurrencyDollar,
      iconColor: 'text-primary-600',
      change: '+15%',
      changeType: 'positive',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: HiClock,
      iconColor: 'text-primary-600',
      change: '-5%',
      changeType: 'negative',
    },
  ];

  const quickActions = [
    { label: 'Products', to: '/admin/products', icon: HiOutlineCube },
    { label: 'Orders', to: '/admin/orders', icon: HiOutlineShoppingCart },
    { label: 'Users', to: '/admin/users', icon: HiUsers },
    { label: 'Wallet', to: '/admin/wallet', icon: MdAccountBalanceWallet },
  ];

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-700';
      case 'processing':
        return 'text-primary-700';
      case 'cancelled':
        return 'text-rose-700';
      default:
        return 'text-emerald-700';
    }
  };

  const getStatusDotClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500';
      case 'processing':
        return 'bg-primary-500';
      case 'cancelled':
        return 'bg-rose-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const formatStatus = (status: string) => {
    const value = String(status || '').trim();
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isUp = card.changeType === 'positive';
          return (
            <div
              key={card.title}
              className="relative bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                isUp ? 'bg-primary-500' : 'bg-rose-500'
              }`} />

              <div className="p-3.5 pl-[18px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{card.title}</span>
                  <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900 tabular-nums tracking-tight">
                    {card.value}
                  </span>
                  <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    isUp ? 'text-primary-700 bg-primary-50' : 'text-rose-700 bg-rose-50'
                  }`}>
                    {card.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary-600 rounded-full" />
          <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3.5 transition-all hover:border-gray-200 hover:shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <ActionIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-800">{action.label}</span>
            </Link>
          );
        })}
      </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-primary-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">{newOrders.length}</span>
          </div>

          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="space-y-1.5">
          {newOrders.length > 0 ? (
            newOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-3.5 py-3"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotClasses(order.status)}`} />

                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <p className="text-xs font-bold text-gray-900 truncate min-w-[100px]">{order.orderId}</p>
                  <p className="text-xs text-gray-500 truncate hidden sm:block flex-1">{order.product}</p>
                  <p className="text-xs text-gray-400 truncate hidden md:block w-24">{order.customer}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs font-bold text-gray-900 tabular-nums">${order.amount.toFixed(2)}</p>
                  <span className={`text-[10px] font-semibold ${getStatusBadgeClasses(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <HiOutlineShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No orders yet</p>
              <p className="text-xs text-gray-400 mt-1">Orders will appear here in real-time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
