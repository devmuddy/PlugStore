import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiX,
  HiOutlineCube,
  HiRefresh,
} from 'react-icons/hi';
import { adminService, type PaymentMethod } from '../../services/api/adminService';

const Wallet = () => {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [paymentFormData, setPaymentFormData] = useState({
    name: '',
    symbol: '',
    walletAddress: '',
    minDeposit: '',
    maxDeposit: '',
  });

  const [iconPreview, setIconPreview] = useState<string>('');
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods = await adminService.getAllPaymentMethods();
      setPayments(methods);
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error);
      toast.error(error.response?.data?.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleAddPayment = async () => {
    if (!paymentFormData.name.trim()) {
      toast.error('Please enter a payment name');
      return;
    }
    if (!paymentFormData.symbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }
    if (!paymentFormData.walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }
    if (paymentFormData.minDeposit && parseFloat(paymentFormData.minDeposit) < 0) {
      toast.error('Minimum deposit must be $0 or greater');
      return;
    }
    if (paymentFormData.maxDeposit && parseFloat(paymentFormData.maxDeposit) < 0) {
      toast.error('Maximum deposit must be $0 or greater');
      return;
    }
    if (
      paymentFormData.minDeposit &&
      paymentFormData.maxDeposit &&
      parseFloat(paymentFormData.minDeposit) > parseFloat(paymentFormData.maxDeposit)
    ) {
      toast.error('Minimum deposit cannot be greater than maximum deposit');
      return;
    }

    try {
      setIsSaving(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('name', paymentFormData.name.trim());
      formData.append('symbol', paymentFormData.symbol.toUpperCase().trim());
      formData.append('walletAddress', paymentFormData.walletAddress.trim());
      if (paymentFormData.minDeposit) {
        formData.append('minDeposit', paymentFormData.minDeposit);
      }
      if (paymentFormData.maxDeposit) {
        formData.append('maxDeposit', paymentFormData.maxDeposit);
      }
      if (iconFile) {
        formData.append('icon', iconFile);
      }
      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      const newPayment = await adminService.createPaymentMethod(formData);
      
      setPayments([...payments, newPayment]);
      setPaymentFormData({
        name: '',
        symbol: '',
        walletAddress: '',
        minDeposit: '',
        maxDeposit: '',
      });
      setIconPreview('');
      setQrCodePreview('');
      setIconFile(null);
      setQrCodeFile(null);
      setShowPaymentForm(false);
      toast.success('Payment method added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPayment = (payment: PaymentMethod) => {
    setEditingPayment(payment);
    setPaymentFormData({
      name: payment.name,
      symbol: payment.symbol,
      walletAddress: payment.walletAddress,
      minDeposit: payment.minDeposit?.toString() || '',
      maxDeposit: payment.maxDeposit?.toString() || '',
    });
    setIconPreview(payment.icon || '');
    setQrCodePreview(payment.qrCode || '');
    setIconFile(null);
    setQrCodeFile(null);
    setShowPaymentForm(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    if (!paymentFormData.name.trim()) {
      toast.error('Please enter a payment name');
      return;
    }
    if (!paymentFormData.symbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }
    if (!paymentFormData.walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }
    if (paymentFormData.minDeposit && parseFloat(paymentFormData.minDeposit) < 0) {
      toast.error('Minimum deposit must be $0 or greater');
      return;
    }
    if (paymentFormData.maxDeposit && parseFloat(paymentFormData.maxDeposit) < 0) {
      toast.error('Maximum deposit must be $0 or greater');
      return;
    }
    if (
      paymentFormData.minDeposit &&
      paymentFormData.maxDeposit &&
      parseFloat(paymentFormData.minDeposit) > parseFloat(paymentFormData.maxDeposit)
    ) {
      toast.error('Minimum deposit cannot be greater than maximum deposit');
      return;
    }

    try {
      setIsSaving(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('name', paymentFormData.name.trim());
      formData.append('symbol', paymentFormData.symbol.toUpperCase().trim());
      formData.append('walletAddress', paymentFormData.walletAddress.trim());
      if (paymentFormData.minDeposit) {
        formData.append('minDeposit', paymentFormData.minDeposit);
      } else {
        formData.append('minDeposit', '');
      }
      if (paymentFormData.maxDeposit) {
        formData.append('maxDeposit', paymentFormData.maxDeposit);
      } else {
        formData.append('maxDeposit', '');
      }
      if (iconFile) {
        formData.append('icon', iconFile);
      }
      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      const updatedPayment = await adminService.updatePaymentMethod(editingPayment.id, formData);
      
      setPayments(payments.map((p) => (p.id === editingPayment.id ? updatedPayment : p)));
      setPaymentFormData({
        name: '',
        symbol: '',
        walletAddress: '',
        minDeposit: '',
        maxDeposit: '',
      });
      setIconPreview('');
      setQrCodePreview('');
      setIconFile(null);
      setQrCodeFile(null);
      setEditingPayment(null);
      setShowPaymentForm(false);
      toast.success('Payment method updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (payment: PaymentMethod) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deletePaymentMethod(paymentToDelete.id);
      
      setPayments(payments.filter((p) => p.id !== paymentToDelete.id));
      setShowDeleteModal(false);
      setPaymentToDelete(null);
      toast.success('Payment method deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete payment method');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatAmount = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet Management</h1>
            <button
              onClick={fetchPaymentMethods}
              className="h-8 w-8 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Refresh wallets"
              title="Refresh wallets"
            >
              <HiRefresh className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Manage cryptocurrency payment methods
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-gray-600">
            {payments.length} wallet{payments.length === 1 ? '' : 's'}
          </p>
          <button
            onClick={() => {
              setShowPaymentForm(true);
              setEditingPayment(null);
              setPaymentFormData({
                name: '',
                symbol: '',
                walletAddress: '',
                minDeposit: '',
                maxDeposit: '',
              });
              setIconPreview('');
              setQrCodePreview('');
              setIconFile(null);
              setQrCodeFile(null);
            }}
            className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Add Payment Method</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Wallet Address
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Limits
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {payment.icon ? (
                          <img
                            src={payment.icon}
                            alt={payment.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-xs">
                              {payment.symbol.substring(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 block">
                            {payment.name}
                          </span>
                          <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                            {payment.symbol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      <div className="max-w-xs truncate font-mono">
                        {payment.walletAddress}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        <p>Min: <span className="font-semibold text-gray-900">${formatAmount(payment.minDeposit)}</span></p>
                        <p>Max: <span className="font-semibold text-gray-900">${formatAmount(payment.maxDeposit)}</span></p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${payment.isActive ? 'text-green-700 bg-green-50' : 'text-gray-600 bg-gray-100'}`}>
                        {payment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditPayment(payment)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(payment)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <HiOutlineCube className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                        No payment methods
                      </p>
                      <p className="text-xs text-gray-500">
                        Add your first cryptocurrency payment method
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setEditingPayment(null);
                  setPaymentFormData({
                    name: '',
                    symbol: '',
                    walletAddress: '',
                    minDeposit: '',
                    maxDeposit: '',
                  });
                  setIconPreview('');
                  setQrCodePreview('');
                  setIconFile(null);
                  setQrCodeFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.name}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="e.g., Bitcoin"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Symbol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.symbol}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, symbol: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="e.g., BTC"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentFormData.walletAddress}
                  onChange={(e) =>
                    setPaymentFormData({ ...paymentFormData, walletAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                  placeholder="Enter wallet address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Minimum Deposit ($) <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentFormData.minDeposit}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, minDeposit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum deposit amount in USD</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Maximum Deposit ($) <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentFormData.maxDeposit}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, maxDeposit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">Maximum deposit amount in USD</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Icon (Optional)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {iconPreview && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Preview:</p>
                      <img
                        src={iconPreview}
                        alt="Icon Preview"
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                      <button
                        onClick={() => {
                          setIconPreview('');
                          setIconFile(null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Remove Icon
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Upload cryptocurrency icon image (max 5MB)
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  QR Code (Optional)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrCodeUpload}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {qrCodePreview && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Preview:</p>
                      <img
                        src={qrCodePreview}
                        alt="QR Code Preview"
                        className="w-32 h-32 object-cover rounded border border-gray-200"
                      />
                      <button
                        onClick={() => {
                          setQrCodePreview('');
                          setQrCodeFile(null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Remove QR Code
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Upload QR code image for the wallet address (max 5MB)
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setEditingPayment(null);
                  setPaymentFormData({
                    name: '',
                    symbol: '',
                    walletAddress: '',
                    minDeposit: '',
                    maxDeposit: '',
                  });
                  setIconPreview('');
                  setQrCodePreview('');
                  setIconFile(null);
                  setQrCodeFile(null);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPayment ? handleUpdatePayment : handleAddPayment}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingPayment ? 'Update' : 'Add'} Payment Method</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && paymentToDelete && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Delete Payment Method
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPaymentToDelete(null);
                }}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete this payment method?
                </p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {paymentToDelete.name} ({paymentToDelete.symbol})
                  </p>
                </div>
                <p className="mt-3 text-xs text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPaymentToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePayment}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineTrash className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
