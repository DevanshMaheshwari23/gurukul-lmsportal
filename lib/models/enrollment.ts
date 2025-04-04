import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  userId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  progress: number;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index on userId and courseId for efficient lookups
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Only create the model if it doesn't already exist
export const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema); 