import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingCart,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCube,
  HiSearch,
  HiChevronDown,
  HiRefresh,
} from 'react-icons/hi';
import { adminService, type Order } from '../../services/api/adminService';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const response = await adminService.getAllOrders(params);
      setOrders(response.orders);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, searchQuery ? 500 : 0); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery]);

  // Client-side filtering for search (backend handles status filter)
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.username.toLowerCase().includes(query) ||
      order.userEmail.toLowerCase().includes(query) ||
      order.productName.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'processing':
        return 'text-primary-700';
      case 'pending':
        return 'text-yellow-700';
      case 'cancelled':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getProductType = (order: Order) => {
    return order.subCategory || order.category || 'N/A';
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Orders</h1>
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="h-8 w-8 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh orders"
              title="Refresh orders"
            >
              <HiRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            View and manage all order history
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by order number, customer, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
        </div>
      </div>

      {/* Orders Count */}
      <div className="text-xs sm:text-sm text-gray-600">
        Showing <span className="font-semibold">{filteredOrders.length}</span> of{' '}
        <span className="font-semibold">{total}</span> orders
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-sm text-gray-600">Loading orders...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <HiOutlineShoppingCart className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {order.username}
                        </div>
                        <div className="text-xs text-gray-500">{order.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-xs sm:text-sm text-gray-900">{order.productName}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-600">
                        {order.category}
                        {order.subCategory && (
                          <span className="text-gray-400"> / {order.subCategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        ${order.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <HiOutlineShoppingCart className="w-12 h-12 mb-2 text-gray-400" />
                      <p className="text-sm">No orders found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className={`py-2.5 ${index !== filteredOrders.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <HiOutlineShoppingCart className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {order.orderNumber}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${order.amount.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2 min-w-0">
                    <HiOutlineUser className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{order.username}</div>
                      <div className="text-xs text-gray-500 truncate">{order.userEmail}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Type</div>
                    <div className="text-xs font-semibold text-gray-700">{getProductType(order)}</div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2 min-w-0">
                    <HiOutlineCube className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 truncate">{order.productName}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {order.category}
                        {order.subCategory && ` / ${order.subCategory}`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-end text-xs text-gray-500">
                  <HiOutlineCalendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <HiOutlineShoppingCart className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-sm">No orders found</p>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;
