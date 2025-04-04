import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

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

// Define interfaces for document types
interface ICourse {
  title: string;
  description: string;
  thumbnailUrl: string;
  sections: any[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Define the Course schema if not already imported from models
let Course: mongoose.Model<ICourse>;
try {
  Course = mongoose.model<ICourse>('Course');
} catch {
  const CourseSchema = new mongoose.Schema({
    title: String,
    description: String,
    thumbnailUrl: String,
    sections: Array,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  Course = mongoose.model<ICourse>('Course', CourseSchema);
}

// Define interface for Enrollment document
interface IEnrollment {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  progress: number;
  completed: boolean;
  createdAt: Date;
}

// Define the Enrollment schema if not already imported from models
let Enrollment: mongoose.Model<IEnrollment>;
try {
  Enrollment = mongoose.model<IEnrollment>('Enrollment');
} catch {
  const EnrollmentSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    progress: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
}

// GET - Fetch dashboard statistics
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
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get time range from query (default 30 days)
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Previous period for growth calculation
    const previousStartDate = new Date(startDate);
    switch (timeframe) {
      case '30d':
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        break;
      case '3m':
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        break;
      case '6m':
        previousStartDate.setMonth(previousStartDate.getMonth() - 6);
        break;
      case '1y':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }
    
    await connectToDatabase();
    
    // Get total user count and new users in period
    const totalUsers = await User.countDocuments({ role: 'student' });
    const newUsers = await User.countDocuments({ 
      role: 'student',
      createdAt: { $gte: startDate } 
    });
    const previousPeriodUsers = await User.countDocuments({ 
      role: 'student',
      createdAt: { $gte: previousStartDate, $lt: startDate } 
    });
    
    // Get course metrics
    const totalCourses = await Course.countDocuments();
    const newCourses = await Course.countDocuments({ 
      createdAt: { $gte: startDate } 
    });
    const previousPeriodCourses = await Course.countDocuments({ 
      createdAt: { $gte: previousStartDate, $lt: startDate } 
    });
    
    // Get enrollment metrics
    const totalEnrollments = await Enrollment.countDocuments();
    const newEnrollments = await Enrollment.countDocuments({ 
      createdAt: { $gte: startDate } 
    });
    const previousPeriodEnrollments = await Enrollment.countDocuments({ 
      createdAt: { $gte: previousStartDate, $lt: startDate } 
    });
    
    // Get completion rate
    const completedEnrollments = await Enrollment.countDocuments({ completed: true });
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedEnrollments / totalEnrollments) * 100) 
      : 0;
    
    // Get active students (students with activity in the last 30 days)
    const activeStudentsDate = new Date();
    activeStudentsDate.setDate(activeStudentsDate.getDate() - 30);
    const activeStudents = await User.countDocuments({
      role: 'student',
      lastActivityAt: { $gte: activeStudentsDate }
    });
    
    const previousActiveStudentsDate = new Date(activeStudentsDate);
    previousActiveStudentsDate.setDate(previousActiveStudentsDate.getDate() - 30);
    const previousActiveStudents = await User.countDocuments({
      role: 'student',
      lastActivityAt: { $gte: previousActiveStudentsDate, $lt: activeStudentsDate }
    });
    
    // Calculate growth percentages
    const userGrowth = previousPeriodUsers > 0 
      ? Math.round(((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100) 
      : 100;
    
    const courseGrowth = previousPeriodCourses > 0 
      ? Math.round(((newCourses - previousPeriodCourses) / previousPeriodCourses) * 100) 
      : 100;
    
    const enrollmentGrowth = previousPeriodEnrollments > 0 
      ? Math.round(((newEnrollments - previousPeriodEnrollments) / previousPeriodEnrollments) * 100) 
      : 100;
    
    const activeStudentsGrowth = previousActiveStudents > 0 
      ? Math.round(((activeStudents - previousActiveStudents) / previousActiveStudents) * 100) 
      : 100;
    
    // Prepare chart data based on timeframe
    const userGrowthData = await getChartData(User, timeframe, { role: 'student' });
    const courseEngagementData = await getCourseEngagementData(timeframe);
    
    // Return the statistics
    return NextResponse.json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        completionRate,
        activeStudents,
        userGrowth: userGrowth.toString(),
        courseGrowth: courseGrowth.toString(),
        enrollmentGrowth: enrollmentGrowth.toString(),
        activeStudentsGrowth: activeStudentsGrowth.toString()
      },
      charts: {
        userGrowth: userGrowthData,
        courseEngagement: courseEngagementData
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Stats error:', error);
    
    // Return mock data during development or if database error occurs
    const mockStats = {
      totalUsers: 150,
      totalCourses: 12,
      totalEnrollments: 320,
      completionRate: 68,
      activeStudents: 89,
      userGrowth: '15',
      courseGrowth: '8',
      enrollmentGrowth: '12',
      activeStudentsGrowth: '5'
    };
    
    const mockCharts = {
      userGrowth: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [10, 15, 18, 22, 25, 30, 35]
      },
      courseEngagement: {
        labels: ['Web Development', 'Data Science', 'Mobile Dev', 'Design', 'AI/ML'],
        data: [85, 70, 65, 55, 40]
      }
    };
    
    return NextResponse.json({
      stats: mockStats,
      charts: mockCharts,
      isMock: true
    }, { status: 200 });
  }
}

// Helper function to get time-based chart data
async function getChartData(model: any, timeframe: string, filter = {}) {
  const now = new Date();
  const labels: string[] = [];
  const data: number[] = [];
  
  // Different grouping based on timeframe
  if (timeframe === '30d') {
    // Last 7 days for 30d view
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayName);
      
      const count = await model.countDocuments({
        ...filter,
        createdAt: { 
          $gte: new Date(date.setHours(0, 0, 0, 0)), 
          $lt: new Date(nextDate.setHours(0, 0, 0, 0)) 
        }
      });
      
      data.push(count);
    }
  } else if (timeframe === '3m') {
    // Last 12 weeks for 3m view
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - (i * 7));
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 7);
      
      const weekLabel = `W${Math.ceil(date.getDate() / 7)}`;
      labels.push(weekLabel);
      
      const count = await model.countDocuments({
        ...filter,
        createdAt: { 
          $gte: new Date(date.setHours(0, 0, 0, 0)), 
          $lt: new Date(nextDate.setHours(0, 0, 0, 0)) 
        }
      });
      
      data.push(count);
    }
  } else {
    // Months for 6m and 1y views
    const monthsToShow = timeframe === '6m' ? 6 : 12;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      labels.push(monthName);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await model.countDocuments({
        ...filter,
        createdAt: { 
          $gte: startOfMonth, 
          $lte: endOfMonth 
        }
      });
      
      data.push(count);
    }
  }
  
  return { labels, data };
}

// Helper function to get course engagement data
async function getCourseEngagementData(timeframe: string) {
  try {
    // Get top 5 courses by enrollment
    const courses = await Course.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'courseId',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          enrollmentCount: { $size: '$enrollments' },
          completionCount: {
            $size: {
              $filter: {
                input: '$enrollments',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.completed', true] }
              }
            }
          }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Calculate engagement percentage
    const labels = courses.map((course: any) => course.title);
    const data = courses.map((course: any) => {
      if (course.enrollmentCount === 0) return 0;
      return Math.round((course.completionCount / course.enrollmentCount) * 100);
    });
    
    return { labels, data };
  } catch (error) {
    console.error('Course engagement data error:', error);
    
    // Return mock data
    return {
      labels: ['Web Development', 'Data Science', 'Mobile Dev', 'Design', 'AI/ML'],
      data: [85, 70, 65, 55, 40]
    };
  }
} 