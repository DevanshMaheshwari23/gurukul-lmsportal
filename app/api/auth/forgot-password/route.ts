import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import { OTP } from '@/lib/models/otp';
import crypto from 'crypto';
import { sendEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });

    // If user not found, still return success to prevent email enumeration
    if (!user) {
      // For security, still return success to prevent email enumeration
      return NextResponse.json({
        message: 'If your email is registered, a password reset code has been sent',
      });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with expiry (10 minutes)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);
    
    // Check if there's an existing OTP for this user
    await OTP.findOneAndDelete({ userId: user._id });
    
    // Create new OTP
    await OTP.create({
      userId: user._id,
      email: user.email,
      otp,
      expiresAt: expiryTime,
    });

    // Use HTML template string instead of React components
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <!-- This creates better rendering in email clients -->
      <div style="display: none; max-height: 0; overflow: hidden;">
        Your password reset verification code is: ${otp}
      </div>
      
      <!-- Header -->
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">Password Reset Verification</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">
          Hello ${user.name || 'Valued User'},
        </p>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">
          Please use the following verification code to complete your request:
        </p>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 6px; margin: 24px 0;">
          <p style="font-size: 28px; letter-spacing: 5px; font-weight: bold; color: #4f46e5; margin: 0;">
            ${otp}
          </p>
        </div>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">
          This code will expire in 10 minutes for security reasons.
        </p>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">
          If you did not request this code, please disregard this email and ensure your account is secure.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280;">
        <p style="margin: 0;">
          © ${new Date().getFullYear()} Gurukul Learning Platform. All rights reserved.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
    `;

    // Generate plain text version
    const textContent = `
GURUKUL LEARNING PLATFORM - PASSWORD RESET

Hello ${user.name || 'Valued User'},

We received a request to reset your password. Please use the following verification code to complete the process:

${otp}

This code will expire in 10 minutes for security reasons.

If you did not request a password reset, please disregard this email and ensure your account is secure.

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} Gurukul Learning Platform. All rights reserved.
    `;

    // Send email
    await sendEmail({
      to: email,
      subject: 'Password Reset Verification Code - Gurukul Learning Platform',
      html: htmlContent,
      text: textContent,
      replyTo: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM
    });

    return NextResponse.json({
      message: 'If your email is registered, a password reset code has been sent',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
} 