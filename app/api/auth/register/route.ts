import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import { Course } from '@/lib/models/course';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const { name, email, password, courseId } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Verify course exists if courseId is provided
    let course = null;
    if (courseId) {
      course = await Course.findById(courseId);
      if (!course) {
        return NextResponse.json(
          { error: 'Selected course not found' },
          { status: 404 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with optional course enrollment
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role: 'student', // Default role is student
      enrolledCourses: courseId ? [courseId] : [],
    };

    const newUser = await User.create(userData);

    // Create JWT token for automatic login
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );

    // Return user data (excluding password) and token
    const responseUser = {
      _id: newUser._id,
      id: newUser._id, // Include both id and _id for consistency with login endpoint
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      enrolledCourses: newUser.enrolledCourses,
      createdAt: newUser.createdAt,
    };

    console.log('User registered successfully:', responseUser.email);

    return NextResponse.json({
      message: 'Registration successful',
      user: responseUser,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 