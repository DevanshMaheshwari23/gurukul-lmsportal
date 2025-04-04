import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose, { Document, Model } from 'mongoose';
import jwt from 'jsonwebtoken';

// Define interfaces for the schemas
interface ICompletedLecture {
  lectureId: mongoose.Types.ObjectId | string;
  completedAt: Date;
}

interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  enrolledAt: Date;
  lastAccessedAt: Date;
  progress: number;
  completedLectures: ICompletedLecture[];
  status: 'active' | 'completed' | 'paused';
}

interface ILecture {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
}

interface IChapter {
  _id: mongoose.Types.ObjectId;
  title: string;
  lectures: ILecture[];
}

interface ISection {
  _id: mongoose.Types.ObjectId;
  title: string;
  chapters: IChapter[];
}

interface ICourse extends Document {
  title: string;
  description: string;
  thumbnailUrl: string;
  sections: ISection[];
  createdBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

// Define Enrollment schema if not already defined
const EnrollmentSchema = new mongoose.Schema<IEnrollment>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0
  },
  completedLectures: [{
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
});

// Create Enrollment model if it doesn't exist
let Enrollment: Model<IEnrollment>;
try {
  Enrollment = mongoose.model<IEnrollment>('Enrollment');
} catch {
  Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
}

// Define Course schema if needed
const CourseSchema = new mongoose.Schema<ICourse>({
  title: String,
  description: String,
  thumbnailUrl: String,
  sections: [{
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    chapters: [{
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      lectures: [{
        _id: mongoose.Schema.Types.ObjectId,
        title: String,
        content: String,
        videoUrl: String,
        duration: Number
      }]
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Course model if it doesn't exist
let Course: Model<ICourse>;
try {
  Course = mongoose.model<ICourse>('Course');
} catch {
  Course = mongoose.model<ICourse>('Course', CourseSchema);
}

// Helper function to verify JWT token and get user
const verifyJwtToken = async (token: string) => {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).userId;
    
    if (!userId) return null;
    
    await connectToDatabase();
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Helper function to find lecture in course
const findLectureInCourse = (course: ICourse, lectureId: string) => {
  for (const section of course.sections) {
    for (const chapter of section.chapters) {
      for (const lecture of chapter.lectures) {
        if (lecture._id.toString() === lectureId) {
          return {
            lecture,
            chapter,
            section,
            courseId: course._id
          };
        }
      }
    }
  }
  return null;
};

// Helper function to find course containing a lecture
const findCourseContainingLecture = async (lectureId: string) => {
  const courses = await Course.find({}).lean<ICourse[]>();
  
  for (const course of courses) {
    const result = findLectureInCourse(course, lectureId);
    if (result) {
      return {
        ...result,
        course
      };
    }
  }
  
  return null;
};

// Helper function to get total lectures in a course
const getTotalLecturesCount = (course: ICourse) => {
  return course.sections.reduce((total: number, section: ISection) => {
    return total + section.chapters.reduce((chapterTotal: number, chapter: IChapter) => {
      return chapterTotal + chapter.lectures.length;
    }, 0);
  }, 0);
};

// GET - Get lecture details
export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ lectureId: string }> }
) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const user = await verifyJwtToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Access lectureId from params - properly awaiting the promise
    const params = await context.params;
    const lectureId = params.lectureId;
    
    // Find course containing the lecture
    await connectToDatabase();
    const result = await findCourseContainingLecture(lectureId);
    
    if (!result) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    const { lecture, chapter, section, course, courseId } = result;
    
    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      userId: user._id,
      courseId: courseId
    }).lean<IEnrollment>();
    
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }
    
    // Update last accessed time
    await Enrollment.findByIdAndUpdate(enrollment._id, {
      lastAccessedAt: new Date()
    });
    
    // Check if lecture is completed
    const isCompleted = enrollment.completedLectures.some(
      (cl) => cl.lectureId.toString() === lectureId
    );
    
    // Get completion data
    const completedLectures = enrollment.completedLectures.length;
    const totalLectures = getTotalLecturesCount(course);
    const progress = Math.round((completedLectures / totalLectures) * 100);
    
    return NextResponse.json({
      lecture: {
        id: lecture._id,
        title: lecture.title,
        content: lecture.content,
        videoUrl: lecture.videoUrl,
        duration: lecture.duration
      },
      chapter: {
        id: chapter._id,
        title: chapter.title
      },
      section: {
        id: section._id,
        title: section.title
      },
      course: {
        id: course._id,
        title: course.title
      },
      progress: {
        isCompleted,
        completedLectures,
        totalLectures,
        percentage: progress
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Lecture fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch lecture details' }, { status: 500 });
  }
}

// PATCH - Mark lecture as completed or uncompleted
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ lectureId: string }> }
) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const user = await verifyJwtToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Access lectureId from params - properly awaiting the promise
    const params = await context.params;
    const lectureId = params.lectureId;
    
    console.log('Toggling completion for lecture:', lectureId, 'by user:', user._id);
    
    // Get request body
    const { completed } = await req.json();
    
    if (completed === undefined) {
      return NextResponse.json({ error: 'Completed status is required' }, { status: 400 });
    }
    
    // Find course containing the lecture
    await connectToDatabase();
    const result = await findCourseContainingLecture(lectureId);
    
    if (!result) {
      console.error('Lecture not found:', lectureId);
      return NextResponse.json({ 
        error: 'Lecture not found',
        lectureId,
        userId: user._id.toString()
      }, { status: 404 });
    }
    
    const { courseId, course } = result;
    
    // Log user's enrolled courses for debugging
    const userEnrollments = await Enrollment.find({ userId: user._id });
    const enrolledCourseIds = userEnrollments.map(e => e.courseId.toString());
    
    console.log('User enrolled courses:', enrolledCourseIds);
    console.log('Requested course:', courseId?.toString() || 'unknown');
    console.log('Is enrolled:', courseId ? enrolledCourseIds.includes(courseId.toString()) : false);
    
    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      userId: user._id,
      courseId: courseId
    }) as IEnrollment | null;
    
    if (!enrollment) {
      console.error('User not enrolled in course');
      return NextResponse.json({ 
        error: 'Not enrolled in this course',
        courseTitle: course.title,
        userId: user._id.toString(),
        courseId: courseId?.toString() || 'unknown',
        message: 'Please enroll in this course before marking lectures as completed'
      }, { status: 403 });
    }
    
    // Update completed status
    if (completed) {
      // Check if already marked as completed
      const alreadyCompleted = enrollment.completedLectures.some(
        (cl) => cl.lectureId.toString() === lectureId
      );
      
      if (!alreadyCompleted) {
        // Add to completed lectures
        enrollment.completedLectures.push({
          lectureId,
          completedAt: new Date()
        });
      }
    } else {
      // Remove from completed lectures
      enrollment.completedLectures = enrollment.completedLectures.filter(
        (cl) => cl.lectureId.toString() !== lectureId
      );
    }
    
    // Update last accessed time
    enrollment.lastAccessedAt = new Date();
    
    // Update progress percentage
    const totalLectures = getTotalLecturesCount(course);
    const completedLectures = enrollment.completedLectures.length;
    enrollment.progress = Math.round((completedLectures / totalLectures) * 100);
    
    // Update status if all lectures are completed
    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
    } else if (enrollment.status === 'completed') {
      enrollment.status = 'active';
    }
    
    await enrollment.save();
    
    return NextResponse.json({
      success: true,
      progress: {
        isCompleted: completed,
        completedLectures,
        totalLectures,
        percentage: enrollment.progress
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Lecture update error:', error);
    return NextResponse.json({ error: 'Failed to update lecture status' }, { status: 500 });
  }
} 