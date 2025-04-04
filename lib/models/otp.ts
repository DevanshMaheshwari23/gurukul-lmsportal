import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index that automatically expires documents
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if model exists before creating a new one (prevents overwrite error during hot reloads)
export const OTP = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema); 