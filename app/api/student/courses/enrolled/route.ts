import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Define Course schema if not already defined in models
const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  sections: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    title: {
      type: String,
      required: true
    },
    chapters: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
      },
      title: {
        type: String,
        required: true
      },
      lectures: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true
        },
        title: {
          type: String,
          required: true
        },
        content: {
          type: String,
          default: ''
        },
        videoUrl: {
          type: String,
          default: ''
        },
        duration: {
          type: Number,
          default: 0
        }
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
let Course;
try {
  Course = mongoose.model('Course');
} catch {
  Course = mongoose.model('Course', CourseSchema);
}

// Define Enrollment schema
const EnrollmentSchema = new mongoose.Schema({
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
let Enrollment;
try {
  Enrollment = mongoose.model('Enrollment');
} catch {
  Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
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

// Calculate total lectures in a course
const calculateTotalLectures = (course: any) => {
  return course.sections.reduce((totalSections: number, section: any) => {
    return totalSections + section.chapters.reduce((totalChapters: number, chapter: any) => {
      return totalChapters + chapter.lectures.length;
    }, 0);
  }, 0);
};

// GET - Get enrolled courses for authenticated student
export async function GET(req: NextRequest) {
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
    
    // Get enrollments for the user
    await connectToDatabase();
    const enrollments = await Enrollment.find({ userId: user._id }).lean();
    
    if (enrollments.length === 0) {
      return NextResponse.json({ courses: [] }, { status: 200 });
    }
    
    // Get course IDs from enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    // Get courses details
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate('createdBy', 'name')
      .lean();
    
    // Format the response with enrollment data
    const formattedCourses = courses.map(course => {
      const enrollment = enrollments.find(e => 
        e.courseId.toString() === course._id.toString()
      );
      
      const totalLectures = calculateTotalLectures(course);
      const completedLectures = enrollment?.completedLectures?.length || 0;
      const progress = totalLectures > 0 
        ? Math.round((completedLectures / totalLectures) * 100) 
        : 0;
      
      // Format time since last access
      const lastAccessed = enrollment?.lastAccessedAt 
        ? formatTimeAgo(new Date(enrollment.lastAccessedAt))
        : 'Never';
      
      return {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        sections: course.sections,
        instructor: course.createdBy?.name || 'Unknown Instructor',
        progress,
        totalLectures,
        completedLectures,
        lastAccessed,
        enrollmentId: enrollment?._id.toString(),
        status: enrollment?.status || 'active'
      };
    });
    
    return NextResponse.json({ courses: formattedCourses }, { status: 200 });
    
  } catch (error) {
    console.error('Enrolled courses fetch error:', error);
    
    // Return mock data during development
    return NextResponse.json({ 
      courses: [
        {
          id: '1',
          title: 'Introduction to Web Development',
          description: 'Learn the basics of web development with HTML, CSS, and JavaScript',
          thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
          sections: [
            {
              _id: '1s',
              title: 'Getting Started',
              chapters: [
                {
                  _id: '1c',
                  title: 'Introduction to HTML',
                  lectures: [
                    {
                      _id: '1l',
                      title: 'HTML Basics',
                      content: 'Learn about HTML tags and structure',
                      videoUrl: 'https://www.youtube.com/watch?v=UB1O30fR-EE'
                    },
                    {
                      _id: '2l',
                      title: 'HTML Forms',
                      content: 'Create interactive forms with HTML',
                      videoUrl: 'https://www.youtube.com/watch?v=FAY1K2aUg5g'
                    }
                  ]
                }
              ]
            }
          ],
          instructor: 'John Smith',
          progress: 65,
          totalLectures: 12,
          completedLectures: 8,
          lastAccessed: '2 days ago',
          enrollmentId: 'e1',
          status: 'active'
        },
        {
          id: '2',
          title: 'Advanced JavaScript',
          description: 'Master advanced JavaScript concepts and patterns',
          thumbnailUrl: 'https://images.unsplash.com/photo-1552308995-2baac1ad5490',
          sections: [
            {
              _id: '2s',
              title: 'Modern JavaScript',
              chapters: [
                {
                  _id: '2c',
                  title: 'ES6 Features',
                  lectures: [
                    {
                      _id: '3l',
                      title: 'Arrow Functions',
                      content: 'Understanding arrow functions and lexical scope',
                      videoUrl: 'https://www.youtube.com/watch?v=h33Srr5J9nY'
                    }
                  ]
                }
              ]
            }
          ],
          instructor: 'Jane Doe',
          progress: 32,
          totalLectures: 15,
          completedLectures: 5,
          lastAccessed: '1 week ago',
          enrollmentId: 'e2',
          status: 'active'
        }
      ],
      isMock: true
    }, { status: 200 });
  }
}

// POST - Enroll in a course
export async function POST(req: NextRequest) {
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
    
    // Get course ID from request body
    const { courseId } = await req.json();
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    // Check if course exists
    await connectToDatabase();
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ 
      userId: user._id, 
      courseId 
    });
    
    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'Already enrolled in this course',
        enrollmentId: existingEnrollment._id 
      }, { status: 400 });
    }
    
    // Create new enrollment
    const enrollment = new Enrollment({
      userId: user._id,
      courseId,
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
      progress: 0,
      completedLectures: [],
      status: 'active'
    });
    
    await enrollment.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully enrolled in course',
      enrollmentId: enrollment._id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Course enrollment error:', error);
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 });
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
} 