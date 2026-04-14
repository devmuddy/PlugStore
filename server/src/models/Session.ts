import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'user' | 'admin';
  sessionToken: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
  };
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType',
    },
    userType: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired sessions
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
sessionSchema.index({ userId: 1, userType: 1 });
sessionSchema.index({ sessionToken: 1 });

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;

