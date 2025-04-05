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
    const body = await request.json();
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
    const dbPromise = connectToDatabase();
    await Promise.race([dbPromise, timeoutPromise]);
    console.log('Connected to database');
    
    // Find user with password included
    const user = await User.findOne({ email }).select('+password');
    
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
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for user:', user._id);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    console.log('Password verified for user:', user._id);
    
    // Update last activity
    user.lastActivityAt = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );
    
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
      code: error.code
    });
    
    if (error.message === 'Request timed out') {
      return NextResponse.json(
        { error: 'Login request timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
} 