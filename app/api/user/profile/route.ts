import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export async function PATCH(request: NextRequest) {
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
    
    // Parse request body
    const requestBody = await request.json();
    const { name, bio, currentPassword, newPassword } = requestBody;
    
    // Update basic profile info
    if (name) {
      user.name = name;
    }
    
    if (bio !== undefined) {
      user.bio = bio;
    }
    
    // Handle password change if requested
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      // Hash and update new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Save updates
    await user.save();
    
    // Return success response with updated user (excluding password)
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userObj
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 