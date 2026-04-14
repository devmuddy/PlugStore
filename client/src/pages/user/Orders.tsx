import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiRefresh,
  HiArrowLeft,
} from 'react-icons/hi';
import { userService, type UserOrder } from '../../services/api/userService';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders from API
  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const response = await userService.getOrders({ page, limit: 20 });
      setOrders(response.orders);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <HiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <HiClock className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <HiClock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <HiXCircle className="w-5 h-5 text-red-600" />;
      default:
        return <HiClock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div>
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-600 transition-colors mb-3"
          >
            <HiArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h1>
            <button
              onClick={() => fetchOrders(true)}
              disabled={isLoading || isRefreshing}
              className="h-8 w-8 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh orders"
              title="Refresh orders"
            >
              <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            View your order history
          </p>
        </div>
      </div>

      {/* Orders Count */}
      <div className="text-xs sm:text-sm text-gray-600">
        Showing <span className="font-semibold">{orders.length}</span> of{' '}
        <span className="font-semibold">{total}</span> orders
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-sm text-gray-600">Loading orders...</p>
          </div>
        </div>
      ) : orders.length > 0 ? (
        <>
          {/* Orders List */}
          <div className="bg-transparent overflow-hidden">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className={`py-2.5 ${index !== orders.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-primary-50">
                      <HiOutlineShoppingCart className="w-5 h-5 text-primary-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {order.orderNumber}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="flex items-start space-x-2 mt-0.5">
                        <HiOutlineCube className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{order.productName}</p>
                          <p className="text-xs text-gray-500 truncate">{order.category}</p>
                          {order.quantity > 1 && (
                            <p className="text-xs text-gray-500">Quantity: {order.quantity}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-bold text-gray-900 leading-none">
                      ${order.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end space-x-1.5 mt-1.5">
                      {getStatusIcon(order.status)}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-[10px] font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {order.deliveryInfo && order.status === 'completed' && (
                  <div className="mt-2.5 pl-11 sm:pl-12">
                    <div className="py-2.5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 mb-1.5">Delivery Information</p>
                      {order.deliveryInfo.key && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Key:</span> {order.deliveryInfo.key}
                        </p>
                      )}
                      {order.deliveryInfo.username && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Username:</span> {order.deliveryInfo.username}
                        </p>
                      )}
                      {order.deliveryInfo.password && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Password:</span> {order.deliveryInfo.password}
                        </p>
                      )}
                      {order.deliveryInfo.email && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Email:</span> {order.deliveryInfo.email}
                        </p>
                      )}
                      {order.deliveryInfo.additionalInfo && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Additional Info:</span> {order.deliveryInfo.additionalInfo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading || isRefreshing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading || isRefreshing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <HiOutlineShoppingCart className="w-12 h-12 mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-900 mb-1">No orders found</p>
            <p className="text-xs text-gray-500">You haven't placed any orders yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
