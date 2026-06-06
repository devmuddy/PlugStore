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

  const pendingCount = deposits.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Deposits</h1>
          <p className="text-xs text-gray-500 mt-0.5">{pendingCount} pending</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <HiRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Deposits Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Tx Hash</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDeposits.length > 0 ? (
                  filteredDeposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{deposit.username || deposit.userEmail.split('@')[0]}</p>
                        <p className="text-[11px] text-gray-400">{deposit.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">${deposit.amount.toFixed(2)}</p>
                        <p className="text-[11px] text-gray-400">{deposit.currency}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">{truncateHash(deposit.transactionHash)}</span>
                          <button
                            onClick={() => copyToClipboard(deposit.transactionHash)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          >
                            <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(deposit.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ${
                          deposit.status === 'approved' ? 'text-emerald-700 bg-emerald-50' :
                          deposit.status === 'rejected' ? 'text-red-700 bg-red-50' :
                          'text-amber-700 bg-amber-50'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {deposit.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openConfirmModal('approve', deposit.id)}
                              disabled={isProcessing === deposit.id}
                              className="h-7 w-7 inline-flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              {isProcessing === deposit.id ? (
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <HiCheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openConfirmModal('reject', deposit.id)}
                              disabled={isProcessing === deposit.id}
                              className="h-7 w-7 inline-flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              {isProcessing === deposit.id ? (
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <HiXCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 capitalize">{deposit.status}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                          <HiOutlineCash className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">No deposits found</p>
                        <p className="text-xs text-gray-400">No pending deposits to review</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.deposit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                confirmModal.type === 'approve' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                {confirmModal.type === 'approve' ? (
                  <HiCheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <HiXCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {confirmModal.type === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
                </h3>
                <p className="text-xs text-gray-500">Are you sure you want to proceed?</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">User:</span>
                <span className="font-semibold text-gray-900">{confirmModal.deposit.username || confirmModal.deposit.userEmail.split('@')[0]}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount:</span>
                <span className="font-semibold text-gray-900">${confirmModal.deposit.amount.toFixed(2)} {confirmModal.deposit.currency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tx Hash:</span>
                <span className="font-mono text-gray-900 text-[10px]">{truncateHash(confirmModal.deposit.transactionHash)}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={closeConfirmModal} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmModal.type === 'approve' ? handleApprove : handleReject}
                disabled={isProcessing === confirmModal.depositId}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing === confirmModal.depositId ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
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
