import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Create Announcement Schema if it doesn't exist yet
const AnnouncementSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['all', 'students', 'admins', 'instructors'],
    default: 'all'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model if it doesn't exist
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

// Helper to verify JWT token
const verifyJwtToken = async (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret') as {
      userId: string;
      email: string;
      role: string;
      id: string;
    };
  } catch (error) {
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and admin status
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }
    
    const payload = await verifyJwtToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Verify admin status
    const admin = await User.findById(payload.userId || payload.id);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    const { subject, message, recipientType } = data;
    
    // Validate request
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    if (!['all', 'students', 'admins', 'instructors'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'Invalid recipient type' },
        { status: 400 }
      );
    }
    
    // Find recipients based on recipientType
    let recipientQuery = {};
    if (recipientType === 'students') {
      recipientQuery = { role: 'student' };
    } else if (recipientType === 'admins') {
      recipientQuery = { role: 'admin' };
    } else if (recipientType === 'instructors') {
      recipientQuery = { role: 'instructor' };
    }
    
    const recipients = await User.find(recipientQuery).select('_id email');
    
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for the selected recipient type' },
        { status: 404 }
      );
    }
    
    // Create announcement
    const announcement = new Announcement({
      subject,
      message,
      recipientType,
      sentBy: admin._id,
      recipientCount: recipients.length,
      sentAt: new Date(),
    });
    
    await announcement.save();
    
    // In a real application, this is where you would queue emails to be sent
    // For demo purposes, we'll just save the announcement to the database
    
    return NextResponse.json({
      message: 'Announcement sent successfully',
      announcementId: announcement._id,
      recipientCount: recipients.length
    });
    
  } catch (error: any) {
    console.error('Error sending announcement:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to send announcement' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and admin status
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }
    
    const payload = await verifyJwtToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Verify admin status
    const admin = await User.findById(payload.userId || payload.id);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Get announcements with pagination
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const announcements = await Announcement.find()
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sentBy', 'name email')
      .lean();
    
    const total = await Announcement.countDocuments();
    
    return NextResponse.json({
      announcements,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
} 