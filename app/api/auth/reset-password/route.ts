import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import { OTP } from '@/lib/models/otp';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const { email, otp, newPassword } = await request.json();

    // Validate input
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find OTP in database and check if it's valid
    const otpRecord = await OTP.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() } // Check if OTP is not expired
    });

    // If OTP not found or expired
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Delete the OTP record after it has been used
    await OTP.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 