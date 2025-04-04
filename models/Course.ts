import mongoose, { Schema, Document } from 'mongoose';

interface IContent {
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  duration?: number; // in minutes
}

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  content: IContent[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const ContentSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz'],
    default: 'text',
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  duration: {
    type: Number,
    default: 0,
  },
});

const CourseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  category: {
    type: String,
    trim: true,
  },
  content: {
    type: [ContentSchema],
    default: [],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// Middleware to update the updatedAt field before saving
CourseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Check if model already exists to prevent overwriting during hot reloading
const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course; 