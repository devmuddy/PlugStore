import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { initializeSocket } from '../../services/socket/socket';
import { userService, type Transaction, type Product } from '../../services/api/userService';
import { categoryService, type Category } from '../../services/api/categoryService';
import { HiPlus, HiCheckCircle, HiClock, HiXCircle, HiOutlineShoppingCart, HiRefresh } from 'react-icons/hi';


const Dashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0.00);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  useEffect(() => {
    // Fetch user dashboard data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [balanceData, transactionsData, productsData, categoriesData] = await Promise.all([
          userService.getBalance(),
          userService.getTransactions(5),
          userService.getProducts(),
          categoryService.getCategories(),
        ]);
        setBalance(balanceData);
        setTransactions(transactionsData);
        setProducts(productsData.products.slice(0, 3));
        setCategories(categoriesData.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize socket connection when dashboard loads
    const socket = initializeSocket();
    
    // Listen for order updates
    socket.on('order:update', (data) => {
      console.log('Order update:', data);
      // Refresh balance and transactions on order update
      fetchData();
    });

    // Initial data fetch
    fetchData();

    return () => {
      socket.off('order:update');
    };
  }, []);

  const handleDeposit = () => {
    window.dispatchEvent(new Event('open-deposit-drawer'));
  };

  const handleRefreshBalance = async () => {
    if (isRefreshingBalance) return;
    try {
      setIsRefreshingBalance(true);
      const latestBalance = await userService.getBalance();
      setBalance(latestBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  const handleOpenProductsDrawer = () => {
    window.dispatchEvent(new Event('open-products-drawer'));
  };

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string, type: string) => {
    if (type === 'order') {
      switch (status) {
        case 'delivered':
          return <HiCheckCircle className="w-5 h-5 text-green-600" />;
        case 'processing':
          return <HiClock className="w-5 h-5 text-primary-600" />;
        case 'pending':
          return <HiClock className="w-5 h-5 text-amber-600" />;
        case 'cancelled':
          return <HiXCircle className="w-5 h-5 text-red-600" />;
        default:
          return <HiClock className="w-5 h-5 text-gray-600" />;
      }
    } else if (type === 'credit') {
      return <HiCheckCircle className="w-5 h-5 text-green-600" />;
    } else if (type === 'debit') {
      return <HiXCircle className="w-5 h-5 text-red-600" />;
    } else {
      switch (status) {
        case 'approved':
          return <HiCheckCircle className="w-5 h-5 text-green-600" />;
        case 'pending':
          return <HiClock className="w-5 h-5 text-amber-600" />;
        case 'rejected':
          return <HiXCircle className="w-5 h-5 text-red-600" />;
        default:
          return null;
      }
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'order') {
      switch (status) {
        case 'delivered':
          return 'text-green-700 bg-green-50';
        case 'processing':
          return 'text-primary-700 bg-primary-50';
        case 'pending':
          return 'text-amber-700 bg-amber-50';
        case 'cancelled':
          return 'text-red-700 bg-red-50';
        default:
          return 'text-gray-700 bg-gray-50';
      }
    } else if (type === 'credit') {
      return 'text-green-700 bg-green-50';
    } else if (type === 'debit') {
      return 'text-red-700 bg-red-50';
    } else {
      switch (status) {
        case 'approved':
          return 'text-green-700 bg-green-50';
        case 'pending':
          return 'text-amber-700 bg-amber-50';
        case 'rejected':
          return 'text-red-700 bg-red-50';
        default:
          return 'text-gray-700 bg-gray-50';
      }
    }
  };


  return (
    <div>
      {/* ── Balance Card ───────────────────────────────── */}
      <div className="w-full mb-5">
        <div className="relative rounded-xl overflow-hidden bg-primary-600 shadow-md shadow-primary-200/40">
          {/* Decorative circles */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="absolute -bottom-5 -left-5 w-24 h-24 rounded-full bg-white/[0.03]" />

          <div className="relative p-4 sm:p-5">
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
                Available Balance
              </p>
              <button
                type="button"
                onClick={handleRefreshBalance}
                disabled={isRefreshingBalance}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
                aria-label="Refresh balance"
              >
                <HiRefresh className={`w-3 h-3 text-white/60 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Amount row */}
            <div className="flex items-center justify-between gap-3">
              <div>
                {isLoading ? (
                  <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
                ) : (
                  <p className="text-white font-bold leading-none tracking-tight text-2xl sm:text-3xl">
                    ${formatBalance(balance)}
                  </p>
                )}
                <p className="text-[11px] text-white/40 font-medium mt-0.5">Wallet funds</p>
              </div>

              <button
                onClick={handleDeposit}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-primary-700 bg-white hover:bg-white/90 transition-all shadow"
              >
                <HiPlus className="w-3.5 h-3.5" />
                Add Funds
              </button>
            </div>
          </div>

          {/* Browse Products strip */}
          <button
            onClick={handleOpenProductsDrawer}
            className="relative w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-white/10 border-t border-white/15 hover:bg-white/15 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-xs font-bold">→</span>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Browse Products</p>
                <p className="text-[10px] text-white/50">Explore all categories &amp; items</p>
              </div>
            </div>
            <span className="text-white/40 group-hover:text-white/70 transition-colors text-xs">Shop now →</span>
          </button>
        </div>
      </div>

      {/* ── Popular Products ───────────────────────────── */}
      {products.length > 0 && (
        <div className="w-full mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Popular Products</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Trending items this week</p>
            </div>
            <button
              onClick={() => navigate('/user/products')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-1" style={{ scrollbarWidth: 'none' }}>
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate(`/user/products?category=${product.categoryId || ''}`)}
                className="px-4 py-2 rounded-lg bg-red-50/80 border border-red-100 text-sm font-medium text-gray-800 whitespace-nowrap hover:bg-red-100 hover:text-primary-700 transition-all shrink-0"
              >
                {product.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Categories ──────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="w-full mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Categories</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Browse by category</p>
            </div>
            <button
              onClick={() => navigate('/user/products')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => navigate(`/user/products?category=${category.id}`)}
                className="px-4 py-2 rounded-lg bg-red-50/80 border border-red-100 text-sm font-medium text-gray-800 whitespace-nowrap hover:bg-red-100 hover:text-primary-700 transition-all shrink-0"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Transactions ────────────────────────── */}
      <div className="w-full">
        <div className="border-b border-gray-100 flex items-center justify-between pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Deposits, orders & credits</p>
          </div>
          <Link
            to="/user/transactions"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 bg-gray-100 rounded" />
                    <div className="h-3 w-20 bg-gray-50 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1">Your history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => {
              const isCredit = transaction.type === 'credit' || transaction.type === 'deposit';
              const isDebit  = transaction.type === 'debit' || transaction.type === 'order';
              const label =
                transaction.type === 'order'   ? 'Order' :
                transaction.type === 'credit'  ? 'Credit' :
                transaction.type === 'debit'   ? 'Debit' : 'Deposit';

              return (
                <div key={transaction.id} className="py-3 flex items-center gap-3 hover:bg-red-50/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(transaction.status, transaction.type)}`}>
                    {transaction.type === 'order'
                      ? <HiOutlineShoppingCart className="w-4 h-4" />
                      : getStatusIcon(transaction.status, transaction.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${getStatusColor(transaction.status, transaction.type)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                    {(transaction.productName || transaction.description) && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {transaction.productName || transaction.description}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-300 mt-0.5">{formatDate(transaction.createdAt)}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold leading-none ${
                      isCredit ? 'text-green-600' : isDebit ? 'text-red-500' : 'text-gray-900'
                    }`}>
                      {isDebit ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
