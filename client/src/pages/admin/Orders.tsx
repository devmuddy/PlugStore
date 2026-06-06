import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingCart,
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
  const [filterOpen, setFilterOpen] = useState(false);
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
        return 'text-emerald-700 bg-emerald-50';
      case 'processing':
        return 'text-primary-700 bg-primary-50';
      case 'pending':
        return 'text-amber-700 bg-amber-50';
      case 'cancelled':
        return 'text-rose-700 bg-rose-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="h-8 w-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <HiRefresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search + Filter */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
          />
        </div>
        <div className="relative ml-auto">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="h-9 w-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            <HiChevronDown className="w-4 h-4" />
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setStatusFilter(option.value); setFilterOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      statusFilter === option.value
                        ? 'text-primary-600 bg-primary-50 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <HiOutlineShoppingCart className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{order.username}</p>
                          <p className="text-xs text-gray-400">{order.userEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{order.productName}</p>
                          <p className="text-xs text-gray-400">
                            {order.category}{order.subCategory ? ` / ${order.subCategory}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">${order.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                            <HiOutlineShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">No orders found</p>
                          <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-100 rounded-lg px-3.5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HiOutlineShoppingCart className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-sm font-bold text-gray-900">{order.orderNumber}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">${order.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
                    <span className="truncate">{order.username}</span>
                    <span className="text-gray-300">|</span>
                    <span className="truncate flex-1">{order.productName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineShoppingCart className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No orders found</p>
                <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;
