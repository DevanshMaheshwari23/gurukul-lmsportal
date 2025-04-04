import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Define Notification Schema if not already defined
let Notification;
try {
  Notification = mongoose.model('Notification');
} catch {
  const NotificationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'announcement'],
      default: 'info'
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  Notification = mongoose.model('Notification', NotificationSchema);
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

// DELETE - Delete a specific notification
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    
    // Get the notification ID from params - properly awaiting the promise
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }
    
    console.log('Deleting notification with ID:', id);
    
    // Delete notification
    await connectToDatabase();
    
    // Try with direct ID match
    let result = await Notification.findOneAndDelete({ 
      _id: id, 
      userId: user._id 
    });
    
    // If no result, try with string comparison
    if (!result) {
      const allNotifications = await Notification.find({ userId: user._id });
      for (const notif of allNotifications) {
        if (notif._id.toString() === id || notif._id === id) {
          result = await Notification.findByIdAndDelete(notif._id);
          break;
        }
      }
    }
    
    if (!result) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Notification deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
} 