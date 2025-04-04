import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Define NotificationState Schema
const NotificationStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readIds: [{
    type: String,
    required: true
  }],
  deletedIds: [{
    type: String,
    required: true
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create NotificationState model if it doesn't exist
let NotificationState;
try {
  NotificationState = mongoose.model('NotificationState');
} catch {
  NotificationState = mongoose.model('NotificationState', NotificationStateSchema);
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

// GET - Get notification states for the authenticated user
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
    
    // Get notification states
    await connectToDatabase();
    
    const state = await NotificationState.findOne({ userId: user._id }).lean();
    
    if (!state) {
      return NextResponse.json({ 
        readIds: [],
        deletedIds: []
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      readIds: state.readIds || [],
      deletedIds: state.deletedIds || []
    }, { status: 200 });
    
  } catch (error) {
    console.error('Notification state fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notification states' }, { status: 500 });
  }
}

// POST - Save notification states for the authenticated user
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
    
    // Parse request body
    const body = await req.json();
    const { readIds, deletedIds } = body;
    
    if (!Array.isArray(readIds) || !Array.isArray(deletedIds)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    // Save notification states
    await connectToDatabase();
    
    const update = {
      $set: {
        userId: user._id,
        updatedAt: new Date()
      }
    };
    
    if (readIds && readIds.length > 0) {
      update.$set.readIds = readIds;
    }
    
    if (deletedIds && deletedIds.length > 0) {
      update.$set.deletedIds = deletedIds;
    }
    
    await NotificationState.findOneAndUpdate(
      { userId: user._id },
      update,
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification states saved successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Notification state save error:', error);
    return NextResponse.json({ error: 'Failed to save notification states' }, { status: 500 });
  }
} 