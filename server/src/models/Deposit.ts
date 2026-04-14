import mongoose, { Document, Schema } from 'mongoose';

export interface IDeposit extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  transactionId?: string;
  proofOfPayment?: string;
  proofPublicId?: string;
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
    },
    transactionId: {
      type: String,
    },
    proofOfPayment: {
      type: String,
    },
    proofPublicId: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
depositSchema.index({ user: 1, createdAt: -1 });
depositSchema.index({ status: 1 });

const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);

export default Deposit;

