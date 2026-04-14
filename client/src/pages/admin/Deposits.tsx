import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiCheckCircle,
  HiXCircle,
  HiOutlineCash,
  HiOutlineDocumentDuplicate,
  HiRefresh,
} from 'react-icons/hi';
import { adminService, type Deposit } from '../../services/api/adminService';

const Deposits = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    depositId: string | null;
    deposit: Deposit | null;
  }>({
    isOpen: false,
    type: null,
    depositId: null,
    deposit: null,
  });

  // Fetch pending deposits
  const fetchDeposits = async () => {
    try {
      setIsLoading(true);
      const depositsData = await adminService.getPendingDeposits();
      setDeposits(depositsData);
    } catch (error: any) {
      console.error('Failed to fetch deposits:', error);
      toast.error(error.response?.data?.message || 'Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDeposits();
  }, []);

  // Refresh deposits
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDeposits();
      toast.success('Deposits refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh deposits');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Only show pending deposits
  const filteredDeposits = deposits.filter((deposit) => deposit.status === 'pending');

  const openConfirmModal = (type: 'approve' | 'reject', depositId: string) => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (deposit) {
      setConfirmModal({
        isOpen: true,
        type,
        depositId,
        deposit,
      });
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: null,
      depositId: null,
      deposit: null,
    });
  };

  const handleApprove = async () => {
    if (!confirmModal.depositId) return;
    
    setIsProcessing(confirmModal.depositId);
    closeConfirmModal();
    
    try {
      const response = await adminService.approveDeposit(confirmModal.depositId);
      
      // Remove approved deposit from list (since we only show pending)
      setDeposits(deposits.filter((deposit) => deposit.id !== confirmModal.depositId));
      
      toast.success(response.message || 'Deposit approved and balance credited successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve deposit');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!confirmModal.depositId) return;
    
    setIsProcessing(confirmModal.depositId);
    closeConfirmModal();
    
    try {
      await adminService.rejectDeposit(confirmModal.depositId);
      
      // Remove rejected deposit from list (since we only show pending)
      setDeposits(deposits.filter((deposit) => deposit.id !== confirmModal.depositId));
      
      toast.success('Deposit rejected successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject deposit');
    } finally {
      setIsProcessing(null);
    }
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Transaction hash copied to clipboard');
  };

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const getInitials = (email: string, username?: string) => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const pendingCount = deposits.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Deposits Management</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh deposits"
              title="Refresh deposits"
            >
              <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Review and manage user deposits
          </p>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          {pendingCount} pending deposit{pendingCount === 1 ? '' : 's'}
        </p>
      </div>


      {/* Mobile Card View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="md:hidden">
          {filteredDeposits.length > 0 ? (
          filteredDeposits.map((deposit) => (
            <div
              key={deposit.id}
              className={`py-3 ${deposit.id !== filteredDeposits[filteredDeposits.length - 1]?.id ? 'border-b border-gray-200' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getInitials(deposit.userEmail, deposit.username)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {deposit.username || deposit.userEmail.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{deposit.userEmail}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center text-xs font-semibold ${
                    deposit.status === 'approved'
                      ? 'text-green-700'
                      : deposit.status === 'rejected'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}
                >
                  {deposit.status}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Amount</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${deposit.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{deposit.currency}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">Transaction Hash</span>
                    <button
                      onClick={() => copyToClipboard(deposit.transactionHash)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy transaction hash"
                    >
                      <HiOutlineDocumentDuplicate className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-gray-900">
                    {truncateHash(deposit.transactionHash)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Date</span>
                  <span className="text-xs text-gray-600">{formatDate(deposit.createdAt)}</span>
                </div>

                {deposit.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => openConfirmModal('approve', deposit.id)}
                      disabled={isProcessing === deposit.id}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing === deposit.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <HiCheckCircle className="w-5 h-5" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openConfirmModal('reject', deposit.id)}
                      disabled={isProcessing === deposit.id}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing === deposit.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <HiXCircle className="w-5 h-5" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center">
              <HiOutlineCash className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">No deposits found</p>
              <p className="text-xs text-gray-500">No pending deposits</p>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Desktop Table View */}
      {isLoading ? (
        <div className="hidden md:flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Transaction Hash
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Date
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeposits.length > 0 ? (
                filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(deposit.userEmail, deposit.username)}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {deposit.username || deposit.userEmail.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{deposit.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          ${deposit.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{deposit.currency}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center space-x-2 max-w-xs">
                        <span className="text-xs font-mono text-gray-600 truncate">
                          {truncateHash(deposit.transactionHash)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(deposit.transactionHash)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy transaction hash"
                        >
                          <HiOutlineDocumentDuplicate className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                      <span>{formatDate(deposit.createdAt)}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${
                          deposit.status === 'approved'
                            ? 'text-green-700'
                            : deposit.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      {deposit.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openConfirmModal('approve', deposit.id)}
                            disabled={isProcessing === deposit.id}
                            className="p-2 text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve deposit"
                          >
                            {isProcessing === deposit.id ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <HiCheckCircle className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => openConfirmModal('reject', deposit.id)}
                            disabled={isProcessing === deposit.id}
                            className="p-2 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject deposit"
                          >
                            {isProcessing === deposit.id ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <HiXCircle className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {deposit.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <HiOutlineCash className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                        No deposits found
                      </p>
                      <p className="text-xs text-gray-500">No pending deposits</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.deposit && (
        <div 
          className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={closeConfirmModal}
        >
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              {confirmModal.type === 'approve' ? (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <HiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <HiXCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmModal.type === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
                </h3>
                <p className="text-sm text-gray-500">Are you sure you want to proceed?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">User:</span>
                  <span className="font-medium text-gray-900">
                    {confirmModal.deposit.username || confirmModal.deposit.userEmail.split('@')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium text-gray-900">
                    ${confirmModal.deposit.amount.toFixed(2)} {confirmModal.deposit.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Hash:</span>
                  <span className="font-mono text-gray-900 text-xs">
                    {truncateHash(confirmModal.deposit.transactionHash)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.type === 'approve' ? handleApprove : handleReject}
                disabled={isProcessing === confirmModal.depositId}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing === confirmModal.depositId ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : (
                  confirmModal.type === 'approve' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deposits;
