'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  FiMail,
  FiUsers,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';
import AdminNavbar from '../../../../components/AdminNavbar';

interface User {
  name?: string;
  email?: string;
  role?: string;
}

interface RecipientOption {
  value: string;
  label: string;
}

export default function NewAnnouncement() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [preview, setPreview] = useState(false);

  // Recipient options
  const recipientOptions: RecipientOption[] = [
    { value: 'all', label: 'All Users' },
    { value: 'students', label: 'All Students' },
    { value: 'admins', label: 'Administrators Only' },
    { value: 'instructors', label: 'Instructors Only' }
  ];

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
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
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Validate form
      if (!subject.trim()) {
        setError('Subject is required');
        setSubmitting(false);
        return;
      }

      if (!message.trim()) {
        setError('Message content is required');
        setSubmitting(false);
        return;
      }

      // Send announcement
      const response = await axios.post('/api/admin/announcements', {
        subject,
        message,
        recipientType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Announcement sent successfully to ${response.data.recipientCount} recipients.`);
      
      // Reset form
      setSubject('');
      setMessage('');
      setRecipientType('all');
      
      // Redirect to announcements list after a delay
      setTimeout(() => {
        router.push('/admin/announcements');
      }, 3000);
    } catch (error: any) {
      console.error('Send announcement error:', error);
      
      if (error.response && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to send announcement. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const togglePreview = () => {
    setPreview(!preview);
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
      <AdminNavbar user={user || null} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Send Announcement</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Create and send an announcement email to users on the platform
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <FiMail className="mr-2" /> Compose Announcement
            </h2>
            <button
              type="button"
              onClick={togglePreview}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {preview ? (
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {subject || '(No subject)'}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  To: {recipientOptions.find(option => option.value === recipientType)?.label || 'All Users'}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 prose prose-sm dark:prose-invert max-w-none">
                  {message ? (
                    <div className="whitespace-pre-wrap">{message}</div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">(No message content)</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Recipients selection */}
              <div>
                <label htmlFor="recipientType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipients
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUsers className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="recipientType"
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white sm:text-sm"
                  >
                    {recipientOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject*
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Announcement subject"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white sm:text-sm"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message*
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder="Enter your announcement message here..."
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Plain text only. Use line breaks for paragraphs.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex">
                  <FiInfo className="text-blue-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This announcement will be sent as an email to all selected recipients. Make sure to review your message before sending.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FiSend className="mr-2" />
                  {submitting ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
} 