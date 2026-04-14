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

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add & edit items',
      to: '/admin/products',
      icon: HiOutlineCube,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      glowBg: 'bg-primary-50',
      barBg: 'bg-primary-500',
    },
    {
      title: 'View Orders',
      description: 'Track purchases',
      to: '/admin/orders',
      icon: HiOutlineShoppingCart,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      glowBg: 'bg-emerald-50',
      barBg: 'bg-emerald-500',
    },
    {
      title: 'Manage Users',
      description: 'View customers',
      to: '/admin/users',
      icon: HiUsers,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      glowBg: 'bg-blue-50',
      barBg: 'bg-blue-500',
    },
    {
      title: 'Wallet',
      description: 'Manage finances',
      to: '/admin/wallet',
      icon: MdAccountBalanceWallet,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      glowBg: 'bg-orange-50',
      barBg: 'bg-orange-500',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-700';
      case 'processing':
        return 'text-blue-700';
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
        return 'bg-blue-500';
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

      {/* Stats Grid - Compact Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const changeNumber = Number(card.change.replace('%', '').replace('+', ''));
          const changeMagnitude = Number.isFinite(changeNumber) ? Math.abs(changeNumber) : 0;
          const barWidth = `${Math.min(100, Math.max(18, Math.round(changeMagnitude * 4)))}%`;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden bg-white rounded-xl p-3.5 sm:p-4 transition-all duration-200 border border-gray-100"
              style={{ animationDelay: `${index * 0.06}s`, animation: 'fadeInUp 0.35s ease-out forwards' }}
            >
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-60 blur-2xl" aria-hidden="true">
                <div className={`h-full w-full rounded-full ${card.iconBg}`} />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-500">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight tabular-nums">
                      {card.value}
                    </p>
                  </div>

                  <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      card.changeType === 'positive'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <span>{card.changeType === 'positive' ? '↗' : '↘'}</span>
                    <span>{card.change}</span>
                  </div>

                  <div className="text-[10px] font-semibold text-gray-400">
                    vs last period
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      card.changeType === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
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
          {quickActions.map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                style={{ animationDelay: `${idx * 0.06}s`, animation: 'fadeInUp 0.35s ease-out forwards' }}
              >
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-70 blur-2xl" aria-hidden="true">
                  <div className={`h-full w-full rounded-full ${action.glowBg}`} />
                </div>

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0`}>
                      <ActionIcon className={`w-5 h-5 ${action.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{action.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">{action.description}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="hidden sm:inline text-[10px] font-semibold text-gray-400 group-hover:text-gray-500 transition-colors">
                      Open
                    </span>
                    <HiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                <div className="relative mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${action.barBg}`} style={{ width: '38%' }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary-600 rounded-full" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Orders</h2>
              <p className="text-xs text-gray-500">
                Latest activity from customers
              </p>
            </div>
          </div>

          <Link
            to="/admin/orders"
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs sm:text-sm font-semibold transition-all group"
          >
            <span>View all</span>
            <HiArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-1 sm:px-2 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <HiOutlineShoppingCart className="w-4 h-4 text-gray-400" />
              <span>{newOrders.length} orders</span>
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              Updated just now
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="hidden md:grid grid-cols-12 gap-3 px-1 sm:px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <div className="col-span-3">Order</div>
            <div className="col-span-3">Product</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {newOrders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {newOrders.map((order, idx) => (
                <div
                  key={order.id}
                  className="group relative px-1 sm:px-2 py-3 sm:py-4 rounded-xl hover:bg-gray-50/60 transition-colors"
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                    animation: 'fadeInUp 0.4s ease-out forwards',
                  }}
                >
                  <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${getStatusDotClasses(order.status)}`} aria-hidden="true" />

                  <div className="md:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 pl-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-gray-900 truncate">{order.orderId}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${getStatusBadgeClasses(order.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClasses(order.status)}`} />
                            {formatStatus(order.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(order.createdAt)}</p>
                        <p className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">{order.product}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-gray-900 tabular-nums">
                          ${order.amount.toFixed(2)}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-gray-400">USD</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 truncate pl-2">
                        <span className="font-semibold text-gray-400">Customer:</span> {order.customer}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3 min-w-0 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-900 truncate">{order.orderId}</p>
                          <p className="text-[11px] text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{order.product}</p>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{order.customer}</p>
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="text-sm font-extrabold text-gray-900 tabular-nums">
                        ${order.amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${getStatusBadgeClasses(order.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClasses(order.status)}`} />
                        {formatStatus(order.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
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
