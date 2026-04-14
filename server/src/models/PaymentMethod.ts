import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentMethod extends Document {
  name: string;
  symbol: string;
  walletAddress: string;
  icon?: string;
  iconPublicId?: string;
  qrCode?: string;
  qrCodePublicId?: string;
  minDeposit?: number;
  maxDeposit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, 'Payment method symbol is required'],
      trim: true,
      uppercase: true,
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
    },
    icon: {
      type: String,
    },
    iconPublicId: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    qrCodePublicId: {
      type: String,
    },
    minDeposit: {
      type: Number,
      min: [0, 'Minimum deposit cannot be negative'],
    },
    maxDeposit: {
      type: Number,
      min: [0, 'Maximum deposit cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentMethodSchema.index({ symbol: 1 });
paymentMethodSchema.index({ isActive: 1 });

const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;

