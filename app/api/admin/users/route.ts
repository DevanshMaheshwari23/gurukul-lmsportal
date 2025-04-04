import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// GET all users (admin only)
export async function GET(request: Request) {
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
    
    // Only admins can access users
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can access this resource' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get users with optional filtering
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');
    
    let query: any = {};
    
    // Filter by role if provided
    if (role && ['student', 'admin', 'instructor'].includes(role)) {
      query.role = role;
    }
    
    // Search by name or email if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get users excluding password field
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user (admin only)
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
    
    // Only admins can create users
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can access this resource' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    const { name, email, password, role } = await request.json();
    
    // Validate fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by the pre-save middleware
      role: role || 'student',
      lastActivityAt: new Date()
    });
    
    await user.save();
    
    // Return user without password
    const newUser = await User.findById(user._id).select('-password');
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user (including blocking/unblocking)
export async function PATCH(request: Request) {
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
    
    // Only admins can update users
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can access this resource' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    const { userId, isBlocked, role, name } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user fields if provided
    if (name !== undefined) {
      user.name = name;
    }
    
    if (role !== undefined && ['student', 'admin', 'instructor'].includes(role)) {
      user.role = role;
    }
    
    // Update isBlocked status if provided
    if (isBlocked !== undefined) {
      // Add isBlocked field to schema if not exists
      user.isBlocked = isBlocked;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 