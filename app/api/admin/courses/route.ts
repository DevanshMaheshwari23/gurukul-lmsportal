import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/models/course';
import { User } from '@/lib/models/user';
import jwt from 'jsonwebtoken';

// Helper function to verify admin token
async function verifyAdminToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret') as {
      userId: string;
      email: string;
      role: string;
    };
    
    if (decodedToken.role !== 'admin') {
      return { error: 'Forbidden: Only admins can access this resource', status: 403 };
    }
    
    return { decodedToken };
  } catch (error) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }
}

// GET all courses (admin only)
export async function GET(request: Request) {
  try {
    console.log('Admin courses API called');
    
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    const verificationResult = await verifyAdminToken(authHeader);
    
    if ('error' in verificationResult) {
      console.log('Token verification failed:', verificationResult.error);
      return NextResponse.json(
        { error: verificationResult.error },
        { status: verificationResult.status }
      );
    }
    
    console.log('Admin authentication successful');
    
    // Connect to database
    try {
      await connectToDatabase();
      console.log('Successfully connected to database');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Unable to connect to database' },
        { status: 503 }
      );
    }
    
    // Get all courses
    try {
      console.log('Fetching all courses');
      // First try without populate to see if that's the issue
      const courses = await Course.find()
        .sort({ createdAt: -1 })
        .lean(); // Use lean for better performance
      
      console.log(`Found ${courses.length} courses`);
      
      // Map courses to remove any invalid references that might cause issues
      const sanitizedCourses = courses.map(course => {
        // Create a clean copy without the createdBy if it's invalid
        const sanitized = { ...course };
        if (sanitized.createdBy && typeof sanitized.createdBy !== 'string' && !sanitized.createdBy._id) {
          delete sanitized.createdBy;
        }
        return sanitized;
      });
      
      return NextResponse.json({ courses: sanitizedCourses || [] });
    } catch (fetchError) {
      console.error('Error fetching courses:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Admin courses error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST - Create a new course with hierarchical structure
export async function POST(request: Request) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    const verificationResult = await verifyAdminToken(authHeader);
    
    if ('error' in verificationResult) {
      return NextResponse.json(
        { error: verificationResult.error },
        { status: verificationResult.status }
      );
    }
    
    const { decodedToken } = verificationResult;
    
    // Connect to database
    await connectToDatabase();
    
    // Parse request body
    const requestBody = await request.json();
    console.log('Received course data:', JSON.stringify(requestBody));
    
    const {
      title,
      description,
      thumbnailUrl,
      sections
    } = requestBody;
    
    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Validate sections if provided
    if (sections && !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Sections must be an array' },
        { status: 400 }
      );
    }
    
    // Create course object
    const courseData = {
      title,
      description,
      thumbnailUrl,
      sections: sections || [],
      isPublic: false,
      createdBy: decodedToken.userId
    };
    
    console.log('Creating course with data:', JSON.stringify(courseData));
    
    // Create new course
    const course = new Course(courseData);
    
    await course.save();
    
    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error('Create course error details:', error.message, error.stack);
    return NextResponse.json(
      { error: `Failed to create course: ${error.message}` },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing course
export async function PATCH(request: Request) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    const verificationResult = await verifyAdminToken(authHeader);
    
    if ('error' in verificationResult) {
      return NextResponse.json(
        { error: verificationResult.error },
        { status: verificationResult.status }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Parse request body
    const {
      courseId,
      title,
      description,
      instructor,
      duration,
      level,
      image,
      sections,
      isPublic
    } = await request.json();
    
    // Validate courseId
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Find course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Update fields if provided
    if (title) course.title = title;
    if (description) course.description = description;
    if (instructor) course.instructor = instructor;
    if (duration) course.duration = duration;
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      course.level = level;
    }
    if (image !== undefined) course.image = image;
    if (sections !== undefined) course.sections = sections;
    if (isPublic !== undefined) course.isPublic = isPublic;
    
    await course.save();
    
    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
} 