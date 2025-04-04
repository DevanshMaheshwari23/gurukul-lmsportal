import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Define Activity Schema if not already defined elsewhere
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

// GET - Fetch recent activities for dashboard
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
    
    // Parse query parameters for limit
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');
    
    // Get recent activities
    await connectToDatabase();
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();
    
    // Format activities for response
    const formattedActivities = activities.map(activity => ({
      _id: activity._id.toString(),
      userId: activity.userId._id.toString(),
      userName: activity.userId.name,
      action: activity.action,
      page: activity.page,
      timestamp: activity.createdAt
    }));
    
    return NextResponse.json({ activities: formattedActivities }, { status: 200 });
    
  } catch (error) {
    console.error('Activities fetch error:', error);
    
    // If database error or no activities yet, return mock data for development
    const mockActivities = [
      {
        _id: '1',
        userId: '1',
        userName: 'Admin User',
        action: 'viewed',
        page: 'Dashboard',
        timestamp: new Date().toISOString()
      },
      {
        _id: '2',
        userId: '1',
        userName: 'Admin User',
        action: 'created',
        page: 'New Course',
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        _id: '3',
        userId: '1',
        userName: 'Admin User',
        action: 'updated',
        page: 'User Settings',
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ];
    
    return NextResponse.json({ 
      activities: mockActivities,
      isMock: true
    }, { status: 200 });
  }
} 