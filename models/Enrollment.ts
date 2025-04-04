import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  progress: number; // Percentage of course completed
  enrolledAt: Date;
  lastAccessed?: Date;
  completed?: boolean;
  completedAt?: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
});

// Create a compound index to ensure a user can't enroll in the same course twice
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Check if model already exists to prevent overwriting during hot reloading
const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment; 