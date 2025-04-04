'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  FiMail,
  FiCalendar,
  FiUsers,
  FiArrowLeft,
  FiUser
} from 'react-icons/fi';
import AdminNavbar from '../../../../components/AdminNavbar';

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Announcement {
  _id: string;
  subject: string;
  message: string;
  recipientType: string;
  recipientCount: number;
  sentBy: User;
  sentAt: string;
  createdAt: string;
}

export default function AnnouncementDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch announcement
  const fetchAnnouncement = async (announcementId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // In a real implementation, we would fetch from the API
      // For now, we'll use mock data
      const mockAnnouncement: Announcement = {
        _id: announcementId,
        subject: 'Important Platform Updates - New Features Released',
        message: `Dear Users,

We're excited to announce several new features that have been added to our platform:

1. Enhanced dashboard analytics with real-time data visualization
2. New course recommendation system based on your learning patterns
3. Improved messaging interface for better communication with instructors
4. Mobile app integration for learning on the go

These features are available immediately. Please log in to your account to explore them.

If you have any questions or need assistance, don't hesitate to contact our support team.

Best regards,
The Gurukul Team`,
        recipientType: 'all',
        recipientCount: 1250,
        sentBy: {
          _id: '1',
          name: 'Admin User',
          email: 'admin@gurukul.com',
          role: 'admin'
        },
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      setAnnouncement(mockAnnouncement);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching announcement:', error);
      
      if (error.response && error.response.status === 403) {
        router.push('/dashboard');
      } else {
        setError('Failed to load announcement. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const announcementId = params.id;
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Get user data
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(userResponse.data.user);
        
        // Check if user is admin
        if (userResponse.data.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        // Fetch announcement
        fetchAnnouncement(announcementId);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, params.id]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get recipient type label
  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return 'All Users';
      case 'students':
        return 'All Students';
      case 'admins':
        return 'Administrators Only';
      case 'instructors':
        return 'Instructors Only';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 dark:bg-primary-700 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar user={user || undefined} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Link 
            href="/admin/announcements" 
            className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            <FiArrowLeft className="mr-2" /> Back to Announcements
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Announcement Details</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {announcement && (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {announcement.subject}
              </h2>
              
              <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <FiCalendar className="mr-2 text-gray-400" />
                  {formatDate(announcement.sentAt)}
                </div>
                
                <div className="flex items-center">
                  <FiUsers className="mr-2 text-gray-400" />
                  {getRecipientTypeLabel(announcement.recipientType)} 
                  <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                    ({announcement.recipientCount} recipients)
                  </span>
                </div>
                
                <div className="flex items-center">
                  <FiUser className="mr-2 text-gray-400" />
                  Sent by: {announcement.sentBy?.name || 'Unknown'} 
                  <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                    ({announcement.sentBy?.email})
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">
                  {announcement.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 