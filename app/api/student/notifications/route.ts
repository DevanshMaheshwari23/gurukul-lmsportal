import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Define Announcement Schema if not already defined elsewhere
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
    enum: ['all', 'students', 'specific'],
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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

// Create Announcement model if it doesn't exist
let Announcement;
try {
  Announcement = mongoose.model('Announcement');
} catch {
  Announcement = mongoose.model('Announcement', AnnouncementSchema);
}

// Define Notification Schema
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

// Create Notification model if it doesn't exist
let Notification;
try {
  Notification = mongoose.model('Notification');
} catch {
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

// GET - Get notifications for the authenticated student
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
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const unreadOnly = url.searchParams.get('unread') === 'true';
    
    // Get notifications
    await connectToDatabase();
    
    // First, get user-specific notifications
    const notifications = await Notification.find({
      userId: user._id,
      ...(unreadOnly ? { read: false } : {})
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    // Also get announcements sent to all users or all students
    const announcements = await Announcement.find({
      $or: [
        { recipientType: 'all' },
        { recipientType: 'students' },
        { recipientType: 'specific', recipients: user._id }
      ],
      sentAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
      .sort({ sentAt: -1 })
      .populate('sentBy', 'name')
      .lean();
    
    // Check if we already have notifications for these announcements
    const existingAnnouncementIds = notifications
      .filter(n => n.announcementId)
      .map(n => n.announcementId.toString());
    
    // Convert announcements to notification format
    const announcementNotifications = announcements
      .filter(a => !existingAnnouncementIds.includes(a._id.toString()))
      .map(announcement => ({
        _id: `temp_${announcement._id}`,
        userId: user._id,
        announcementId: announcement._id,
        title: announcement.subject,
        message: announcement.message,
        type: 'announcement',
        read: false,
        createdAt: announcement.sentAt,
        sentBy: announcement.sentBy?.name || 'Admin'
      }));
    
    // Create notification entries for announcements
    if (announcementNotifications.length > 0) {
      const newNotifications = announcementNotifications.map(an => ({
        userId: user._id,
        announcementId: an.announcementId,
        title: an.title,
        message: an.message,
        type: 'announcement',
        read: false,
        createdAt: an.createdAt
      }));
      
      await Notification.insertMany(newNotifications);
    }
    
    // Combine and sort all notifications
    const allNotifications = [
      ...notifications,
      ...announcementNotifications
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
    
    // Format the response
    const formattedNotifications = allNotifications.map(notification => ({
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      date: notification.createdAt,
      read: notification.read,
      sentBy: notification.sentBy || 'System'
    }));
    
    return NextResponse.json({ 
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        hasMore: formattedNotifications.length === limit
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Notifications fetch error:', error);
    
    // Return mock data during development
    return NextResponse.json({ 
      notifications: [
        {
          id: '1',
          title: 'Course Update',
          message: 'New materials have been added to your enrolled course',
          type: 'info',
          date: new Date().toISOString(),
          read: false,
          sentBy: 'System'
        },
        {
          id: '2',
          title: 'Welcome!',
          message: 'Welcome to Gurukul Learning Platform. Start your learning journey today!',
          type: 'success',
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: true,
          sentBy: 'Admin'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        hasMore: false
      },
      isMock: true
    }, { status: 200 });
  }
}

// PATCH - Mark a notification as read
export async function PATCH(req: NextRequest) {
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
    
    // Get notification ID from request body
    const body = await req.json();
    const id = body.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }
    
    console.log('Marking notification as read:', id);
    
    // Update notification
    await connectToDatabase();
    
    // Try first with direct ID match
    let notification = await Notification.findOneAndUpdate(
      { _id: id, userId: user._id },
      { read: true },
      { new: true }
    );
    
    // If no notification found, try with string comparison
    if (!notification) {
      const allNotifications = await Notification.find({ userId: user._id });
      for (const notif of allNotifications) {
        if (notif._id.toString() === id || notif._id === id) {
          notif.read = true;
          notification = await notif.save();
          break;
        }
      }
    }
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
} 