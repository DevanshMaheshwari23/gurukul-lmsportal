import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/models/course';
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

// GET specific course
export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    
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
    
    // Get course by ID
    const course = await Course.findById(courseId)
      .populate('createdBy', 'name email');
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific course
export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    
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
      title,
      description,
      instructor,
      duration,
      level,
      image,
      sections,
      isPublic
    } = await request.json();
    
    // Find course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Update fields if provided
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (instructor !== undefined) course.instructor = instructor;
    if (duration !== undefined) course.duration = duration;
    if (level !== undefined && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
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

// DELETE - Remove specific course
export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    
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
    
    // Find and delete course
    const deletedCourse = await Course.findByIdAndDelete(courseId);
    
    if (!deletedCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Course deleted successfully',
      courseId: courseId
    });
  } catch (error: any) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
} 

// PUT - Update entire course
export async function PUT(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    
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
    const courseData = await request.json();
    
    // Find course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Update all fields
    Object.assign(course, courseData);
    
    await course.save();
    
    return NextResponse.json({
      message: 'Course updated successfully', 
      course
    });
  } catch (error: any) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
} 