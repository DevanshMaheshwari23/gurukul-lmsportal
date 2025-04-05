import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/models/course';
import { User } from '@/lib/models/user';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    console.log('Courses API called with URL:', request.url);
    
    // Get URL and query parameters
    const url = new URL(request.url);
    const publicOnly = url.searchParams.get('publicOnly') === 'true';
    const enrolled = url.searchParams.get('enrolled') === 'true';

    console.log('Query parameters:', { publicOnly, enrolled });

    // Connect to database
    try {
      await connectToDatabase();
      console.log('Successfully connected to database');
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Unable to connect to database' },
        { status: 503 }
      );
    }

    // For public courses, no auth needed
    if (publicOnly) {
      try {
        console.log('Fetching public courses...');
        const courses = await Course.find({ isPublic: true })
          .select('_id title description instructor duration level image')
          .sort({ createdAt: -1 });
        
        console.log(`Found ${courses.length} public courses`);
        console.log('Public courses:', JSON.stringify(courses));
        
        // Return empty array instead of null if no courses found
        return NextResponse.json({ courses: courses || [] });
      } catch (error) {
        console.error('Error fetching public courses:', error);
        console.error('Error details:', JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        }));
        return NextResponse.json(
          { error: 'Failed to fetch public courses' },
          { status: 500 }
        );
      }
    }

    // For authenticated requests, verify the token
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret') as {
        userId: string;
        email: string;
        role: string;
      };
      console.log('Token verified for user:', decodedToken.email);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Handle enrolled courses request (for students)
    if (enrolled && decodedToken.role === 'student') {
      try {
        console.log('Fetching enrolled courses for student:', decodedToken.userId);
        // Find the user and their enrolled courses
        const user = await User.findById(decodedToken.userId).select('enrolledCourses');
        
        if (!user) {
          console.log('User not found:', decodedToken.userId);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Get the courses the user is enrolled in
        const courses = await Course.find({
          _id: { $in: user.enrolledCourses }
        }).select('_id title description instructor duration level image');
        
        console.log(`Found ${courses.length} enrolled courses for user`);
        return NextResponse.json({ courses });
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        return NextResponse.json(
          { error: 'Failed to fetch enrolled courses' },
          { status: 500 }
        );
      }
    }
    
    // For admin users or when not querying enrolled courses
    let query = {};
    
    // If not admin, only return public courses
    if (decodedToken.role !== 'admin') {
      query = { isPublic: true };
    }
    
    try {
      console.log('Fetching courses with query:', query);
      const courses = await Course.find(query)
        .select('_id title description instructor duration level image enrolledCount isPublic')
        .sort({ createdAt: -1 });
      
      console.log(`Found ${courses.length} courses`);
      return NextResponse.json({ courses });
    } catch (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Get courses error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret') as {
        userId: string;
        email: string;
        role: string;
      };
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
    
    // Only admins can create courses
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create courses' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Parse the request body
    const courseData = await request.json();
    
    // Validate required fields
    if (!courseData.title || !courseData.description || !courseData.instructor) {
      return NextResponse.json(
        { error: 'Title, description, and instructor are required' },
        { status: 400 }
      );
    }
    
    // Set default values if not provided
    const newCourse = {
      ...courseData,
      enrolledCount: 0,
      isPublic: courseData.isPublic !== undefined ? courseData.isPublic : false,
      createdAt: new Date(),
      createdBy: decodedToken.userId
    };
    
    // Create the course
    const course = await Course.create(newCourse);
    
    return NextResponse.json({
      message: 'Course created successfully',
      course
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
} 