import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type Transaction } from '../../services/api/userService';
import {
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiOutlineShoppingCart,
  HiRefresh,
  HiArrowLeft,
} from 'react-icons/hi';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      const data = await userService.getTransactions(100);
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string, type: string) => {
    if (type === 'order') {
      switch (status) {
        case 'delivered':  return <HiCheckCircle className="w-4 h-4 text-green-600" />;
        case 'processing': return <HiClock className="w-4 h-4 text-primary-600" />;
        case 'pending':    return <HiClock className="w-4 h-4 text-amber-600" />;
        case 'cancelled':  return <HiXCircle className="w-4 h-4 text-red-600" />;
        default:           return <HiClock className="w-4 h-4 text-gray-500" />;
      }
    }
    if (type === 'credit')  return <HiCheckCircle className="w-4 h-4 text-green-600" />;
    if (type === 'debit')   return <HiXCircle className="w-4 h-4 text-red-500" />;
    switch (status) {
      case 'approved': return <HiCheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':  return <HiClock className="w-4 h-4 text-amber-600" />;
      case 'rejected': return <HiXCircle className="w-4 h-4 text-red-500" />;
      default:         return null;
    }
  };

  const getIconColors = (status: string, type: string) => {
    if (type === 'order') {
      switch (status) {
        case 'delivered':  return 'bg-green-50 text-green-600';
        case 'processing': return 'bg-primary-50 text-primary-600';
        case 'pending':    return 'bg-amber-50 text-amber-600';
        case 'cancelled':  return 'bg-red-50 text-red-500';
        default:           return 'bg-gray-50 text-gray-500';
      }
    }
    if (type === 'credit')  return 'bg-green-50 text-green-600';
    if (type === 'debit')   return 'bg-red-50 text-red-500';
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600';
      case 'pending':  return 'bg-amber-50 text-amber-600';
      case 'rejected': return 'bg-red-50 text-red-500';
      default:         return 'bg-gray-50 text-gray-500';
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'order') {
      switch (status) {
        case 'delivered':  return 'text-green-700 bg-green-50';
        case 'processing': return 'text-primary-700 bg-primary-50';
        case 'pending':    return 'text-amber-700 bg-amber-50';
        case 'cancelled':  return 'text-red-700 bg-red-50';
        default:           return 'text-gray-600 bg-gray-50';
      }
    }
    if (type === 'credit') return 'text-green-700 bg-green-50';
    if (type === 'debit')  return 'text-red-700 bg-red-50';
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-50';
      case 'pending':  return 'text-amber-700 bg-amber-50';
      case 'rejected': return 'text-red-700 bg-red-50';
      default:         return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-5">
        <button
          onClick={() => navigate('/user/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-600 transition-colors mb-4"
        >
          <HiArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="auth-heading text-xl font-bold text-gray-900">Transactions</h1>
            <p className="text-xs text-gray-400 mt-0.5">Your complete history</p>
          </div>
          <button
            onClick={() => fetchTransactions(true)}
            disabled={isLoading || isRefreshing}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 disabled:opacity-40 transition-colors"
          >
            <HiRefresh className={`w-3.5 h-3.5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────── */}
      {isLoading ? (
        <div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`flex items-center gap-3 py-3 animate-pulse ${i !== 5 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-gray-100 rounded" />
                <div className="h-2.5 w-20 bg-gray-50 rounded" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-3.5 w-16 bg-gray-100 rounded ml-auto" />
                <div className="h-2.5 w-12 bg-gray-50 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <HiOutlineShoppingCart className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No transactions yet</p>
          <p className="text-xs text-gray-400 mt-1">Your history will appear here</p>
        </div>
      ) : (
        <div>
          {transactions.map((tx, index) => {
            const isCredit = tx.type === 'credit' || tx.type === 'deposit';
            const isDebit  = tx.type === 'debit'  || tx.type === 'order';
            const label =
              tx.type === 'order'  ? 'Order'   :
              tx.type === 'credit' ? 'Credit'  :
              tx.type === 'debit'  ? 'Debit'   : 'Deposit';

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 py-3 ${index !== transactions.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getIconColors(tx.status, tx.type)}`}>
                  {tx.type === 'order'
                    ? <HiOutlineShoppingCart className="w-3.5 h-3.5" />
                    : getStatusIcon(tx.status, tx.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                  {(tx.productName || tx.description) && (
                    <p className="text-xs text-gray-400 truncate">{tx.productName || tx.description}</p>
                  )}
                  <p className="text-[11px] text-gray-400">{formatDate(tx.createdAt)}</p>
                </div>

                {/* Amount + badge */}
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-bold leading-none ${
                    isCredit ? 'text-green-600' : isDebit ? 'text-red-500' : 'text-gray-900'
                  }`}>
                    {isDebit ? '-' : '+'}${tx.amount.toFixed(2)}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1.5 ${getStatusBadge(tx.status, tx.type)}`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;
