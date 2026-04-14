import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { initializeSocket } from '../../services/socket/socket';
import { userService, type Transaction } from '../../services/api/userService';
import { HiPlus, HiCheckCircle, HiClock, HiXCircle, HiOutlineShoppingCart, HiRefresh } from 'react-icons/hi';


const Dashboard = () => {
  const [balance, setBalance] = useState<number>(0.00);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  useEffect(() => {
    // Fetch user balance and transactions from API
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [balanceData, transactionsData] = await Promise.all([
          userService.getBalance(),
          userService.getTransactions(5),
        ]);
        setBalance(balanceData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Keep default values on error
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
          return <HiClock className="w-5 h-5 text-blue-600" />;
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
          return 'text-blue-700 bg-blue-50';
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
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          {/* Blue accent top bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />

          <div className="p-5">
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Available Balance
              </p>
              <button
                type="button"
                onClick={handleRefreshBalance}
                disabled={isRefreshingBalance}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 disabled:opacity-40 transition-colors"
                aria-label="Refresh balance"
              >
                <HiRefresh className={`w-3.5 h-3.5 text-gray-400 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Amount + Deposit on same row */}
            <div className="flex items-center justify-between gap-3">
              <div>
                {isLoading ? (
                  <div className="h-9 w-32 rounded-lg bg-gray-100 animate-pulse" />
                ) : (
                  <p className="auth-heading text-gray-900 font-bold leading-none" style={{ fontSize: '2.1rem' }}>
                    ${formatBalance(balance)}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">Wallet funds</p>
              </div>

              <button
                onClick={handleDeposit}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}
              >
                <HiPlus className="w-4 h-4" />
                Add Funds
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Browse Banner ───────────────────────────────── */}
      <button
        onClick={handleOpenProductsDrawer}
        className="w-full mb-5 flex items-center justify-between px-5 py-4 rounded-2xl text-left group bg-primary-600"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Store
          </p>
          <p className="auth-heading text-white font-bold text-base leading-tight">
            Browse Products
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Explore all categories &amp; items
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <span className="text-white font-bold text-sm">→</span>
        </div>
      </button>

      {/* ── Recent Transactions ────────────────────────── */}
      <div className="w-full">
        <div className="bg-transparent overflow-hidden">
          <div className="py-3 border-b border-gray-100 flex items-center justify-between mb-1">
            <div>
              <h2 className="auth-heading text-sm font-bold text-gray-900">Recent Transactions</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Deposits, orders & credits</p>
            </div>
            <Link
              to="/user/transactions"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="pt-1">
            {isLoading ? (
              [1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-2.5 w-16 bg-gray-50 rounded" />
                  </div>
                  <div className="h-4 w-14 bg-gray-100 rounded" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-500">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Your history will appear here</p>
              </div>
            ) : (
              transactions.map((transaction, index) => {
                const isCredit = transaction.type === 'credit' || transaction.type === 'deposit';
                const isDebit  = transaction.type === 'debit' || transaction.type === 'order';
                const label =
                  transaction.type === 'order'   ? 'Order' :
                  transaction.type === 'credit'  ? 'Credit' :
                  transaction.type === 'debit'   ? 'Debit' : 'Deposit';

                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center gap-3 py-2.5 ${index !== transactions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(transaction.status, transaction.type)}`}>
                      {transaction.type === 'order'
                        ? <HiOutlineShoppingCart className="w-3.5 h-3.5" />
                        : getStatusIcon(transaction.status, transaction.type)}
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                      {(transaction.productName || transaction.description) && (
                        <p className="text-xs text-gray-400 truncate">
                          {transaction.productName || transaction.description}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400">{formatDate(transaction.createdAt)}</p>
                    </div>

                    {/* Amount + status */}
                    <div className="shrink-0 text-right">
                      <p className={`text-base font-bold leading-none ${
                        isCredit ? 'text-green-600' : isDebit ? 'text-red-500' : 'text-gray-900'
                      }`}>
                        {isDebit ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1.5 ${getStatusColor(transaction.status, transaction.type)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
