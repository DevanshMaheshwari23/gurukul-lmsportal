import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

// Verify JWT token and get user
async function verifyJwtToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Token is required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const user = await verifyJwtToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    // Check if user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Forbidden - Not a student account' },
        { status: 403 }
      );
    }
    
    // Find enrolled courses for the student
    const enrolledCourseIds = user.enrolledCourses || [];
    
    // Populate courses with full details
    await connectToDatabase();
    const courses = await Course.find({
      _id: { $in: enrolledCourseIds }
    })
    .select('title description thumbnailUrl sections createdBy');
    
    // Calculate progress per course
    const coursesWithProgress = courses.map(course => {
      const courseObject = course.toObject();
      
      // Add instructor name from the course data
      courseObject.instructor = { name: courseObject.instructor || 'Instructor' };
      
      // Get progress data for this course from user enrolledCoursesProgress
      const progressData = user.enrolledCoursesProgress?.find(
        progress => progress.courseId.toString() === course._id.toString()
      );
      
      // Calculate progress percentage
      let progressPercentage = 0;
      if (progressData) {
        const totalLectures = getTotalLecturesCount(course);
        const completedLectures = progressData.completedLectures?.length || 0;
        
        progressPercentage = totalLectures > 0 
          ? Math.round((completedLectures / totalLectures) * 100) 
          : 0;
      }
      
      return {
        ...courseObject,
        progress: progressPercentage
      };
    });
    
    return NextResponse.json({
      courses: coursesWithProgress
    });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled courses' },
      { status: 500 }
    );
  }
}

// Helper function to count total lectures in a course
function getTotalLecturesCount(course: any): number {
  let totalLectures = 0;
  
  if (course.sections && Array.isArray(course.sections)) {
    course.sections.forEach((section: any) => {
      if (section.chapters && Array.isArray(section.chapters)) {
        section.chapters.forEach((chapter: any) => {
          if (chapter.lectures && Array.isArray(chapter.lectures)) {
            totalLectures += chapter.lectures.length;
          }
        });
      }
    });
  }
  
  return totalLectures;
} 