import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiArrowLeft,
  HiX,
  HiOutlineDocumentDuplicate,
  HiCheckCircle,
} from 'react-icons/hi';
import { userService, type PaymentMethod } from '../../services/api/userService';

interface Props {
  open: boolean;
  onClose: () => void;
}

const DepositDrawer = ({ open, onClose }: Props) => {
  const [step, setStep] = useState<'select' | 'deposit'>('select');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: '', transactionHash: '' });
  const [amountFocused, setAmountFocused] = useState(false);

  // Hide Jivo chat behind the drawer
  useEffect(() => {
    if (open) {
      document.body.classList.add('deposit-drawer-open');
    } else {
      document.body.classList.remove('deposit-drawer-open');
    }
    return () => document.body.classList.remove('deposit-drawer-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchPaymentMethods = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getPaymentMethods();
        setPaymentMethods(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaymentMethods();
  }, [open]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select');
        setSelectedPayment(null);
        setDepositForm({ amount: '', transactionHash: '' });
        setCopiedAddress(false);
      }, 300);
    }
  }, [open]);

  const formatNumber = (num: number) =>
    num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      onClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const isFormValid = () => {
    if (!selectedPayment) return false;
    const amount = parseFloat(depositForm.amount);
    if (!depositForm.amount.trim() || isNaN(amount) || amount <= 0) return false;
    if (selectedPayment.minDeposit && amount < selectedPayment.minDeposit) return false;
    if (selectedPayment.maxDeposit && amount > selectedPayment.maxDeposit) return false;
    if (!depositForm.transactionHash.trim()) return false;
    return true;
  };

  const handleDeposit = async () => {
    if (!selectedPayment) return;
    if (!depositForm.amount.trim()) { toast.error('Please enter deposit amount'); return; }
    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Please enter a valid amount'); return; }
    if (selectedPayment.minDeposit && amount < selectedPayment.minDeposit) {
      toast.error(`Minimum deposit is $${formatNumber(selectedPayment.minDeposit)}`); return;
    }
    if (selectedPayment.maxDeposit && amount > selectedPayment.maxDeposit) {
      toast.error(`Maximum deposit is $${formatNumber(selectedPayment.maxDeposit)}`); return;
    }
    if (!depositForm.transactionHash.trim()) { toast.error('Please enter transaction hash'); return; }

    try {
      setIsSubmitting(true);
      await userService.createDeposit({
        paymentMethodId: selectedPayment.id,
        amount,
        transactionId: depositForm.transactionHash.trim(),
      });
      toast.success('Deposit submitted! It will be reviewed by our team.');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[88vw] max-w-md z-40 bg-white shadow-2xl border-l border-gray-200 rounded-l-2xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="px-4 pt-3 pb-4 border-b border-gray-100 bg-white rounded-tl-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step === 'deposit' && (
                  <button
                    onClick={handleBack}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <HiArrowLeft className="w-4 h-4 text-gray-500" />
                  </button>
                )}
                <div>
                  <h3 className="auth-heading text-base font-bold text-gray-900">
                    {step === 'select' ? 'Add Funds' : selectedPayment?.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {step === 'select' ? 'Choose a payment method' : selectedPayment?.symbol}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <HiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* Step 1 — Select payment method */}
            {step === 'select' && (
              <div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 bg-gray-100 rounded" />
                          <div className="h-2.5 w-32 bg-gray-50 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-gray-500">No payment methods available</p>
                  </div>
                ) : (
                  <div>
                    {paymentMethods.map((payment, index) => (
                      <button
                        key={payment.id}
                        onClick={() => handleSelectPayment(payment)}
                        className={`w-full flex items-center gap-3 py-3 text-left group transition-colors ${
                          index !== paymentMethods.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {/* Icon */}
                        {payment.icon ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                            <img src={payment.icon} alt={payment.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary-50 shrink-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600">{payment.symbol.charAt(0)}</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {payment.name}
                            <span className="text-gray-400 font-normal ml-1.5">({payment.symbol})</span>
                          </p>
                          {payment.minDeposit && payment.maxDeposit && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Min ${formatNumber(payment.minDeposit)} · Max ${formatNumber(payment.maxDeposit)}
                            </p>
                          )}
                        </div>

                        <span className="text-gray-300 group-hover:text-primary-500 transition-colors text-sm">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Deposit form */}
            {step === 'deposit' && selectedPayment && (
              <div className="space-y-5">

                {/* Wallet address */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Wallet Address
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedPayment.walletAddress}
                      readOnly
                      className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedPayment.walletAddress)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-600 text-white shrink-0 hover:bg-primary-700 transition-colors"
                    >
                      {copiedAddress
                        ? <HiCheckCircle className="w-4 h-4" />
                        : <HiOutlineDocumentDuplicate className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* QR code */}
                {selectedPayment.qrCode && (
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">QR Code</p>
                    <div className="inline-block p-3 border border-gray-200 rounded-xl">
                      <img src={selectedPayment.qrCode} alt="QR Code" className="w-36 h-36" />
                    </div>
                    <div className="mt-3 px-3 py-2 bg-primary-50 rounded-xl">
                      <p className="text-[11px] text-primary-700">
                        Copy address → Send amount → Paste hash → Submit
                      </p>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Amount (USD)
                  </p>
                  <div
                    className="flex items-end gap-1.5 pb-2"
                    style={{ borderBottom: `1.5px solid ${amountFocused ? '#dc2626' : '#cbd5e1'}`, transition: 'border-color 0.25s' }}
                  >
                    <span className="text-base font-bold text-gray-400 leading-none mb-0.5">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={depositForm.amount}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v))
                          setDepositForm({ ...depositForm, amount: v });
                      }}
                      onFocus={() => setAmountFocused(true)}
                      onBlur={() => setAmountFocused(false)}
                      placeholder="0.00"
                      className="flex-1 border-none outline-none bg-transparent text-base font-semibold text-gray-900 placeholder-gray-300"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                  {selectedPayment.minDeposit && selectedPayment.maxDeposit && (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Min ${formatNumber(selectedPayment.minDeposit)} · Max ${formatNumber(selectedPayment.maxDeposit)}
                    </p>
                  )}
                  {depositForm.amount && parseFloat(depositForm.amount) > 0 && selectedPayment.minDeposit && parseFloat(depositForm.amount) < selectedPayment.minDeposit && (
                    <p className="text-[11px] text-red-500 mt-1">Minimum is ${formatNumber(selectedPayment.minDeposit)}</p>
                  )}
                  {depositForm.amount && parseFloat(depositForm.amount) > 0 && selectedPayment.maxDeposit && parseFloat(depositForm.amount) > selectedPayment.maxDeposit && (
                    <p className="text-[11px] text-red-500 mt-1">Maximum is ${formatNumber(selectedPayment.maxDeposit)}</p>
                  )}
                </div>

                {/* Transaction hash */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Transaction Hash
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={depositForm.transactionHash}
                      onChange={(e) => setDepositForm({ ...depositForm, transactionHash: e.target.value })}
                      placeholder="Paste hash after transfer"
                      className="auth-input font-mono text-xs"
                    />
                    <span className="auth-input-bar" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Paste the hash from your wallet after completing the transfer
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer — submit button */}
          {step === 'deposit' && (
            <div className="px-4 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={handleDeposit}
                disabled={isSubmitting || !isFormValid()}
                className="auth-btn"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Deposit →'}
              </button>
            </div>
          )}

        </div>
      </aside>
    </>
  );
};

export default DepositDrawer;
