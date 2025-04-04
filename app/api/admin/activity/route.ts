import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Define Activity Schema
const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['view', 'create', 'update', 'delete']
  },
  page: {
    type: String,
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  ip: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Activity model if it doesn't exist
let Activity;
try {
  Activity = mongoose.model('Activity');
} catch {
  Activity = mongoose.model('Activity', ActivitySchema);
}

// Helper function to verify JWT token and get user
const verifyJwtToken = async (token: string) => {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).userId;
    
    if (!userId) return null;
    
    await connectToDatabase();
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// POST - Log a new activity
export async function POST(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const user = await verifyJwtToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get request body
    const body = await req.json();
    const { action, page, details } = body;
    
    if (!action || !page) {
      return NextResponse.json({ error: 'Action and page are required' }, { status: 400 });
    }
    
    // Create new activity
    await connectToDatabase();
    const activity = new Activity({
      userId: user._id,
      action,
      page,
      details: details || {},
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });
    
    await activity.save();
    
    return NextResponse.json({ success: true, activity }, { status: 201 });
    
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

// GET - Get all activities (for admin dashboard)
export async function GET(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const user = await verifyJwtToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Get activities
    await connectToDatabase();
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name email')
      .lean();
    
    // Format activities for response
    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      userId: activity.userId._id,
      userName: activity.userId.name,
      action: activity.action,
      page: activity.page,
      details: activity.details,
      timestamp: activity.createdAt
    }));
    
    // Get total count for pagination
    const total = await Activity.countDocuments();
    
    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
} 