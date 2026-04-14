import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  wallet: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  relatedOrder?: mongoose.Types.ObjectId;
  relatedDeposit?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet is required'],
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedDeposit: {
      type: Schema.Types.ObjectId,
      ref: 'Deposit',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ wallet: 1, createdAt: -1 });

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;

