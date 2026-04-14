import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiArrowLeft,
  HiOutlineDocumentDuplicate,
  HiCheckCircle,
} from 'react-icons/hi';
import { userService, type PaymentMethod } from '../../services/api/userService';

const Deposits = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'deposit'>('select');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const [depositForm, setDepositForm] = useState({
    amount: '',
    transactionHash: '',
  });

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getPaymentMethods();
        setPaymentMethods(data);
      } catch (error: any) {
        console.error('Failed to fetch payment methods:', error);
        toast.error(error.response?.data?.message || 'Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleSelectPayment = (payment: PaymentMethod) => {
    setSelectedPayment(payment);
    setStep('deposit');
  };

  const handleBack = () => {
    if (step === 'deposit') {
      setStep('select');
      setSelectedPayment(null);
      setDepositForm({ amount: '', transactionHash: '' });
    } else {
      navigate('/user/dashboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!selectedPayment) return false;
    
    const amount = parseFloat(depositForm.amount);
    
    // Check if amount is entered and valid
    if (!depositForm.amount.trim() || isNaN(amount) || amount <= 0) {
      return false;
    }
    
    // Check min/max limits
    if (selectedPayment.minDeposit && amount < selectedPayment.minDeposit) {
      return false;
    }
    
    if (selectedPayment.maxDeposit && amount > selectedPayment.maxDeposit) {
      return false;
    }
    
    // Check if transaction hash is entered
    if (!depositForm.transactionHash.trim()) {
      return false;
    }
    
    return true;
  };

  const handleDeposit = async () => {
    if (!selectedPayment) return;

    // Validation
    if (!depositForm.amount.trim()) {
      toast.error('Please enter deposit amount');
      return;
    }

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedPayment.minDeposit && amount < selectedPayment.minDeposit) {
      toast.error(`Minimum deposit is $${formatNumber(selectedPayment.minDeposit)}`);
      return;
    }

    if (selectedPayment.maxDeposit && amount > selectedPayment.maxDeposit) {
      toast.error(`Maximum deposit is $${formatNumber(selectedPayment.maxDeposit)}`);
      return;
    }

    if (!depositForm.transactionHash.trim()) {
      toast.error('Please enter transaction hash');
      return;
    }

    try {
      setIsSubmitting(true);

      await userService.createDeposit({
        paymentMethodId: selectedPayment.id,
        amount: amount,
        transactionId: depositForm.transactionHash.trim(),
      });

      toast.success('Deposit submitted successfully! It will be reviewed by our team.');
      
      // Reset form and navigate
      setDepositForm({ amount: '', transactionHash: '' });
      setSelectedPayment(null);
      setStep('select');
      
      // Navigate immediately to dashboard after successful submission
      navigate('/user/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-600 transition-colors mb-3"
        >
          <HiArrowLeft className="w-3.5 h-3.5" />
          {step === 'deposit' ? 'Back' : 'Back to Dashboard'}
        </button>
        <h1 className="text-xl font-bold text-gray-900">Make a Deposit</h1>
        <p className="text-xs text-gray-400 mt-0.5">Add funds to your wallet</p>
      </div>

      {/* Step 1: Select Payment Method */}
      {step === 'select' && (
        <div>
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Select Payment Method</h2>
            <p className="text-xs text-gray-500">Choose a cryptocurrency to deposit</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No payment methods available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((payment) => (
                <button
                  key={payment.id}
                  onClick={() => handleSelectPayment(payment)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-left group"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {payment.icon ? (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white">
                        <img
                          src={payment.icon}
                          alt={payment.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary-600">
                          {payment.symbol.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{payment.name}</h3>
                        <span className="text-sm text-gray-500">({payment.symbol})</span>
                      </div>
                      {payment.minDeposit && payment.maxDeposit && (
                        <p className="text-xs text-gray-500">
                          Min: ${formatNumber(payment.minDeposit)} • Max: ${formatNumber(payment.maxDeposit)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <HiArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transform rotate-180 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Deposit Form */}
      {step === 'deposit' && selectedPayment && (
        <div>
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              {selectedPayment.icon ? (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                  <img
                    src={selectedPayment.icon}
                    alt={selectedPayment.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-base font-bold text-primary-600">
                    {selectedPayment.symbol.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-gray-900">{selectedPayment.name}</h2>
                <p className="text-xs text-gray-500">{selectedPayment.symbol}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Wallet Address
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={selectedPayment.walletAddress}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-0 focus:border-gray-300"
                />
                <button
                  onClick={() => copyToClipboard(selectedPayment.walletAddress)}
                  className="px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <HiCheckCircle className="w-5 h-5" />
                  ) : (
                    <HiOutlineDocumentDuplicate className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* QR Code */}
            {selectedPayment.qrCode && (
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  QR Code
                </label>
                <div className="inline-block p-3 bg-white border border-gray-300 rounded-lg">
                  <img
                    src={selectedPayment.qrCode}
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                </div>
                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 max-w-md mx-auto">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Quick steps:</span> Copy wallet address → Send amount → Enter transaction hash → Submit
                  </p>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                value={depositForm.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty, numbers, and decimals
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setDepositForm({ ...depositForm, amount: value });
                  }
                }}
                placeholder="Enter amount in USD"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {selectedPayment.minDeposit && selectedPayment.maxDeposit && (
                <p className="text-xs text-gray-500 mt-2">
                  Min: ${formatNumber(selectedPayment.minDeposit)} • Max: ${formatNumber(selectedPayment.maxDeposit)}
                </p>
              )}
              {depositForm.amount && parseFloat(depositForm.amount) > 0 && (
                <>
                  {selectedPayment.minDeposit && parseFloat(depositForm.amount) < selectedPayment.minDeposit && (
                    <p className="text-xs text-red-600 mt-1">
                      Amount must be at least ${formatNumber(selectedPayment.minDeposit)}
                    </p>
                  )}
                  {selectedPayment.maxDeposit && parseFloat(depositForm.amount) > selectedPayment.maxDeposit && (
                    <p className="text-xs text-red-600 mt-1">
                      Amount cannot exceed ${formatNumber(selectedPayment.maxDeposit)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Transaction Hash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Transaction Hash
              </label>
              <input
                type="text"
                value={depositForm.transactionHash}
                onChange={(e) => setDepositForm({ ...depositForm, transactionHash: e.target.value })}
                placeholder="Enter transaction hash after making transfer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the transaction hash from your wallet after completing the transfer
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                onClick={handleDeposit}
                disabled={isSubmitting || !isFormValid()}
                className={`w-full px-6 py-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  isSubmitting
                    ? 'bg-primary-400 cursor-wait text-white'
                    : !isFormValid()
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-white">Submitting...</span>
                  </>
                ) : (
                  <span>Submit Deposit</span>
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
