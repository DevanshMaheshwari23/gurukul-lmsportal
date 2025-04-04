import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
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

// GET specific user
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
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
    
    // Get user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific user
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
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
    
    // Get update data
    const { name, role, isBlocked } = await request.json();
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user fields if provided
    if (name) {
      user.name = name;
    }
    
    if (role && ['student', 'admin', 'instructor'].includes(role)) {
      user.role = role;
    }
    
    // Update isBlocked status if provided
    if (isBlocked !== undefined) {
      // @ts-ignore - Add the isBlocked field
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

// DELETE - Remove specific user
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
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
    
    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully',
      userId: userId
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 