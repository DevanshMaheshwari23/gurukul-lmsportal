'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { FiBook, FiCalendar, FiClock, FiUser, FiAward } from 'react-icons/fi';
import Navbar from '../components/Navbar';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  image?: string;
  sections: {
    title: string;
    content: string;
  }[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  enrolledCourses?: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Get user info
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userRole = response.data.user.role;
        
        // Redirect based on role
        if (userRole === 'admin') {
          router.push('/admin/dashboard');
        } else if (userRole === 'student') {
          router.push('/student/dashboard');
        } else if (userRole === 'instructor') {
          router.push('/instructor/dashboard');
        }
        // For any other role, stay on the generic dashboard
        
      } catch (error) {
        console.error('Auth error:', error);
        
        // If authentication fails, redirect to login
        localStorage.removeItem('token');
        router.push('/login');
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);

  const fetchCourseDetails = async (courseId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedCourse(response.data.course);
    } catch (error) {
      console.error('Failed to fetch course details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-xl font-medium text-gray-900 dark:text-white">Redirecting to your dashboard...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Redirect admin to admin dashboard
  if (user.role === 'admin') {
    router.push('/admin/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar - Course List */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                My Courses
              </h2>
              
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You are not enrolled in any courses yet.
                  </p>
                  <Link 
                    href="/courses" 
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {courses.map((course) => (
                    <li key={course._id}>
                      <button
                        onClick={() => fetchCourseDetails(course._id)}
                        className={`w-full text-left px-4 py-3 rounded-md transition duration-150 ease-in-out ${
                          selectedCourse && selectedCourse._id === course._id
                            ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {course.title}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <FiUser className="mr-1" />
                          <span>{course.instructor}</span>
                          <span className="mx-2">•</span>
                          <FiClock className="mr-1" />
                          <span>{course.duration}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="md:col-span-2">
            {selectedCourse ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                {/* Course Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCourse.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <FiUser className="mr-1" />
                      <span>{selectedCourse.instructor}</span>
                    </div>
                    <div className="flex items-center">
                      <FiClock className="mr-1" />
                      <span>{selectedCourse.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <FiAward className="mr-1" />
                      <span>{selectedCourse.level}</span>
                    </div>
                  </div>
                </div>
                
                {/* Course Content */}
                <div className="p-6">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <h2 className="text-xl font-semibold mb-4">About This Course</h2>
                    <p>{selectedCourse.description}</p>
                    
                    {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                      <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                        <div className="space-y-6">
                          {selectedCourse.sections.map((section, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <h3 className="text-lg font-medium mb-2">{section.title}</h3>
                              <div dangerouslySetInnerHTML={{ __html: section.content }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 text-center bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
                        <p>Course content is being prepared. Please check back later.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
                <FiBook className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  Select a course
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a course from the list to view its content.
                </p>
                {courses.length === 0 && (
                  <div className="mt-6">
                    <Link 
                      href="/courses" 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Browse Available Courses
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 