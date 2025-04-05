import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Set timeout for the entire function
const TIMEOUT_MS = 8000; // 8 seconds timeout

export async function POST(request: Request) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out'));
    }, TIMEOUT_MS);
  });

  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    
    console.log('Login request received for:', email);
    
    // Validate input
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Connect to database with timeout
    try {
      const dbPromise = connectToDatabase();
      await Promise.race([dbPromise, timeoutPromise]);
      console.log('Connected to database');
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Unable to connect to database. Please try again later.' },
        { status: 503 }
      );
    }
    
    // Find user with password included
    let user;
    try {
      user = await User.findOne({ email }).select('+password');
    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'An error occurred while processing your request' },
        { status: 500 }
      );
    }
    
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    console.log('User found:', user._id);
    
    // Check if user is blocked
    if (user.isBlocked) {
      console.log('Login failed: User is blocked:', user._id);
      return NextResponse.json(
        { error: 'Your account has been blocked. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Verify password
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Password comparison error:', error);
      return NextResponse.json(
        { error: 'An error occurred while verifying your password' },
        { status: 500 }
      );
    }
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for user:', user._id);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    console.log('Password verified for user:', user._id);
    
    // Update last activity
    try {
      user.lastActivityAt = new Date();
      await user.save();
    } catch (error) {
      console.error('Failed to update user last activity:', error);
      // Continue with login even if this fails
    }
    
    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '7d' }
      );
    } catch (error) {
      console.error('JWT token generation error:', error);
      return NextResponse.json(
        { error: 'An error occurred while generating your session' },
        { status: 500 }
      );
    }
    
    console.log('JWT token generated for user:', user._id);
    
    // Return user info without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    console.log('Login successful for user:', user._id, 'with role:', user.role);
    
    return NextResponse.json({
      user: userResponse,
      token
    });
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      type: error.type,
      cause: error.cause
    });
    
    if (error.message === 'Request timed out') {
      return NextResponse.json(
        { error: 'Login request timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
} 