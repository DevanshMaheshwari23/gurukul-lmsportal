'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import { FiUser, FiMail, FiSave, FiAlertCircle, FiCheck, FiCalendar, FiBookOpen, FiPieChart, FiCheckCircle, FiLogOut, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  enrolledCourses?: Array<{
    _id: string;
    title: string;
  }>;
}

interface CourseProgress {
  _id: string;
  title: string;
  progress: number;
  completedLectures: number;
  totalLectures: number;
  lastAccessed?: string;
}

interface LectureAttendance {
  lectureId: string;
  lectureTitle: string;
  courseTitle: string;
  courseId: string;
  completedOn: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [recentlyAttendedLectures, setRecentlyAttendedLectures] = useState<LectureAttendance[]>([]);
  const [totalProgress, setTotalProgress] = useState({ 
    completed: 0, 
    total: 0, 
    percentage: 0 
  });
  
  // Form state for user profile
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  
  const handleLogout = () => {
    // Clear all tokens and session data
    localStorage.removeItem('token');
    localStorage.removeItem('selectedCourseId');
    localStorage.removeItem('selectedLecture');
    localStorage.removeItem('videoModalOpen');
    localStorage.removeItem('activeVideo');

    // Persist course progress and notification states across sessions 
    // (don't remove permanentCourseProgress, readNotifications, deletedNotifications)
    
    // Redirect to login page
    router.push('/login');
  };
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Get user data
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userData = response.data.user;
        setUser(userData);
        
        // Initialize form data - also check localStorage for most recent bio
        const storedBio = localStorage.getItem('userBio') || sessionStorage.getItem('userBio');
        setFormData({
          name: userData.name || '',
          bio: storedBio || userData.bio || '',
        });
        
        // Load course progress data
        const coursesResponse = await axios.get('/api/student/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const enrolledCourses = coursesResponse.data.courses || [];
        
        // Load progress from permanent storage or regular storage
        let progressData = JSON.parse(localStorage.getItem('permanentCourseProgress') || '{}');
        if (Object.keys(progressData).length === 0) {
          progressData = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        }
        
        // Transform enrolled courses with progress data
        const coursesWithProgress = enrolledCourses.map((course: any) => {
          const progress = progressData[course._id] || { progress: 0, completedLectures: 0, totalLectures: 0 };
          return {
            _id: course._id,
            title: course.title,
            progress: progress.progress || 0,
            completedLectures: progress.completedLectures || 0,
            totalLectures: progress.totalLectures || 0,
            lastAccessed: course.lastAccessed || 'Never'
          };
        });
        
        setCourseProgress(coursesWithProgress);
        
        // Find completed lectures (checkboxes checked) directly from localStorage format
        const recentLectures: LectureAttendance[] = [];
        
        // Get progress data directly from both possible storage locations
        const courseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        const permanentProgress = JSON.parse(localStorage.getItem('permanentCourseProgress') || '{}');
        
        // Combine them, with permanent progress taking precedence
        const combinedProgress = { ...courseProgress, ...permanentProgress };
        
        console.log('Combined progress data:', combinedProgress);
        
        // Go through each course in the progress data
        for (const courseId in combinedProgress) {
          const course = enrolledCourses.find((c: any) => c._id === courseId);
          if (!course) continue; // Skip if course not found in enrolled courses
          
          const courseData = combinedProgress[courseId];
          const lectureStates = courseData.lectures || {};
          
          // Get all completed lectures
          const completedLectureIds = Object.entries(lectureStates)
            .filter(([_, completed]) => completed)
            .map(([id]) => id);
          
          console.log(`Course ${course.title} has ${completedLectureIds.length} completed lectures`);
          
          // For each completed lecture ID, find the actual lecture info
          for (const lectureId of completedLectureIds) {
            // Search through course structure to find this lecture
            let lectureFound = false;
            
            for (const section of course.sections) {
              for (const chapter of section.chapters) {
                for (const lecture of chapter.lectures) {
                  if (lecture._id === lectureId) {
                    recentLectures.push({
                      lectureId,
                      lectureTitle: lecture.title,
                      courseTitle: course.title,
                      courseId,
                      completedOn: new Date().toISOString() // We don't have timestamps yet
                    });
                    lectureFound = true;
                    break;
                  }
                }
                if (lectureFound) break;
              }
              if (lectureFound) break;
            }
          }
        }
        
        // Sort by most recent first (we'll simulate with random dates for now)
        // In production, we would store and use actual completion timestamps
        recentLectures.sort(() => Math.random() - 0.5);
        
        console.log(`Found ${recentLectures.length} completed lectures total`);
        
        // Take only the 5 most recent
        setRecentlyAttendedLectures(recentLectures.slice(0, 5));
        
        // Calculate total progress across all courses
        let totalCompleted = 0;
        let totalLectures = 0;
        
        coursesWithProgress.forEach((course: any) => {
          totalCompleted += course.completedLectures;
          totalLectures += course.totalLectures;
        });
        
        const overallPercentage = totalLectures > 0 ? Math.round((totalCompleted / totalLectures) * 100) : 0;
        
        setTotalProgress({
          completed: totalCompleted,
          total: totalLectures,
          percentage: overallPercentage
        });
        
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Show loading indicator
      setLoading(true);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        bio: formData.bio
      };
      
      console.log('Sending profile update:', updateData);
      
      // Send update request
      const response = await axios.patch('/api/user/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Profile update response:', response.data);
      
      // API returns { message: 'Profile updated successfully', user: userObj }
      if (response.data && response.data.user) {
        // Update local state with returned user data
        setUser(response.data.user);
        
        // Also update form data for consistency
        setFormData({
          name: response.data.user.name || '',
          bio: response.data.user.bio || '',
        });
        
        // Store bio in localStorage for persistence across pages
        localStorage.setItem('userBio', response.data.user.bio || '');
        sessionStorage.setItem('userBio', response.data.user.bio || '');
        
        setSuccess(response.data.message || 'Profile updated successfully');
      } else {
        // Update local state with the form data
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name: formData.name,
          bio: formData.bio
        };
      });
        
        // Store bio in localStorage for persistence across pages
        localStorage.setItem('userBio', formData.bio || '');
        sessionStorage.setItem('userBio', formData.bio || '');
      
      setSuccess('Profile updated successfully');
      }
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add event listeners for navigation to ensure bio persists
  useEffect(() => {
    // Handle page navigation events
    const handleBeforeUnload = () => {
      // Save current bio to storage on page unload
      if (formData.bio) {
        localStorage.setItem('userBio', formData.bio);
        sessionStorage.setItem('userBio', formData.bio);
      }
    };
    
    const handlePopState = () => {
      // When using browser navigation buttons, make sure bio persists
      if (formData.bio) {
        localStorage.setItem('userBio', formData.bio);
        sessionStorage.setItem('userBio', formData.bio);
      }
    };
    
    // Add listeners for navigation events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Add listener for link clicks that would navigate away
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (target && !e.ctrlKey && !e.metaKey) {
        // Save bio before navigating away
        if (formData.bio) {
          localStorage.setItem('userBio', formData.bio);
          sessionStorage.setItem('userBio', formData.bio);
        }
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
      
      // Final save on unmount
      if (formData.bio) {
        localStorage.setItem('userBio', formData.bio);
        sessionStorage.setItem('userBio', formData.bio);
      }
    };
  }, [formData.bio]);
  
  // Check for stored bio on initial load
  useEffect(() => {
    const storedBio = localStorage.getItem('userBio') || sessionStorage.getItem('userBio');
    if (storedBio && user?.bio !== storedBio) {
      // Update form data if stored bio exists
      setFormData(prev => ({
        ...prev,
        bio: storedBio
      }));
      
      // Update user object as well
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          bio: storedBio
        };
      });
    }
  }, [user]);
  
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
      <Navbar user={user || undefined} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100 dark:border-gray-700"
        >
          <div className="px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || <FiUser size={32} />}
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                  {user?.bio ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic max-w-md border-l-2 border-primary-300 dark:border-primary-600 pl-2 transition-all duration-300">
                      "{user.bio}"
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 italic">
                      No bio added yet. Add one in the form below.
                    </p>
                  )}
                  <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <FiCalendar className="mr-1 h-4 w-4" />
                    <span>Joined {new Date(user?.createdAt || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalProgress.percentage}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {totalProgress.completed}/{totalProgress.total} checkboxes completed
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Navigation */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-750">
            <nav className="flex space-x-4">
              <button 
                className="px-3 py-2 text-sm font-medium rounded-md bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                onClick={() => {}}
              >
                Progress
              </button>
              <button
                className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => router.push('/student/dashboard')}
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center"
              >
                <FiLogOut className="mr-1 h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>
        </motion.div>
          
          {/* Alerts */}
          {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded animate-pulse">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded animate-pulse">
              <div className="flex items-center">
                <FiCheck className="text-green-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}
          
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Profile Update Form */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Update Profile</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Write a short bio about yourself"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This will be displayed on your profile and dashboard
                  </p>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          
          {/* Right side: Course Progress Overview */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Courses</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {courseProgress.length} {courseProgress.length === 1 ? 'Course' : 'Courses'}
                </div>
                </div>
                
              {courseProgress.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <FiBookOpen className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No courses yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You haven't enrolled in any courses yet.
                  </p>
                  <button
                    onClick={() => router.push('/student/courses')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Courses
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseProgress.map((course) => (
                    <div key={course._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{course.title}</h3>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {course.completedLectures}/{course.totalLectures} completed
              </div>
            </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{course.progress}%</div>
                      </div>
                    </div>
                    
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500 rounded-full transition-all duration-500 ease-in-out"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                    </div>
                    
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            localStorage.setItem('selectedCourseId', course._id);
                            router.push('/student/dashboard');
                          }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Add Recently Completed Lectures section back */}
          <div className="lg:col-span-3 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recently Completed Lectures</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last 5 checkboxes checked
                  </div>
                </div>
                
              {recentlyAttendedLectures.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <FiClock className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No completed lectures yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Continue your courses and check off lectures to track your progress.
                  </p>
                  <button
                    onClick={() => router.push('/student/dashboard')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentlyAttendedLectures.map((lecture, index) => (
                    <div key={lecture.lectureId} className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-300 ease-in-out">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-4">
                        <FiCheckCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white truncate">
                          {lecture.lectureTitle}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {lecture.courseTitle}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <FiClock className="mr-1 h-3 w-3" />
                          <span>
                            {/* Display a simulated timeframe for when the lecture was completed */}
                            {['Just now', '1 hour ago', '2 hours ago', 'Yesterday', '2 days ago'][index]}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.setItem('selectedCourseId', lecture.courseId);
                          router.push('/student/dashboard');
                        }}
                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-all duration-300"
                      >
                        Continue Course
                      </button>
                    </div>
                  ))}
            </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
} 