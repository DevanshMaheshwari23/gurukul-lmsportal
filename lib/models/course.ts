import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for the hierarchical structure
export interface ILecture extends Document {
  title: string;
  videoUrl: string;
  description?: string;
  duration?: number;
}

export interface IChapter extends Document {
  title: string;
  lectures: ILecture[];
}

export interface ISection extends Document {
  title: string;
  chapters: IChapter[];
}

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor?: string;
  duration?: string;
  level?: string;
  thumbnailUrl?: string;
  sections: ISection[];
  enrolledCount: number;
  isPublic: boolean;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

// Define schemas
const LectureSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Lecture title is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  description: {
    type: String
  },
  duration: {
    type: Number,
    default: 0
  }
});

const ChapterSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required']
  },
  lectures: [LectureSchema]
});

const SectionSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Section title is required']
  },
  chapters: [ChapterSchema]
});

const CourseSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: false
  },
  duration: {
    type: String,
    default: '8 weeks'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  thumbnailUrl: {
    type: String
  },
  sections: [SectionSchema],
  enrolledCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Check if model exists before creating a new one (prevents overwrite error during hot reloads)
export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);