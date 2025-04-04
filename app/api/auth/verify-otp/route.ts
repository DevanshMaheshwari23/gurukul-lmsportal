import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OTP } from '@/lib/models/otp';

export async function POST(request: Request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find OTP in database
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

    // OTP is valid - don't delete it yet as it will be needed for password reset
    return NextResponse.json({
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 