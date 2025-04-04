'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiBook, FiUser, FiLogOut, FiMenu, FiX, FiMoon, FiSun, FiSettings, FiPieChart, FiCheckCircle } from 'react-icons/fi';

interface NavbarProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const handleLogout = () => {
    // Clear authentication token or session
    localStorage.removeItem('token');
    // Redirect to login page
    router.push('/login');
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };
  
  // Check if a link is active
  const isActive = (path: string) => {
    if (path === '/student/dashboard' && pathname === '/student/dashboard') return true;
    if (path === '/student/profile' && pathname === '/student/profile') return true;
    if (path === '/profile' && pathname === '/profile') return true;
    return false;
  };

  // Add function to get recently completed lectures
  const getRecentlyCompletedLectures = () => {
    if (typeof window === 'undefined') return [];
    
    try {
      // Get course progress data
      const courseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
      
      // Track completed lectures with timestamps
      const completedLectures = [];
      
      // Process each course's lecture completion data
      Object.keys(courseProgress).forEach(courseId => {
        const courseData = courseProgress[courseId];
        if (courseData && courseData.lectures) {
          // Get lecture completion status
          Object.keys(courseData.lectures).forEach(lectureId => {
            if (courseData.lectures[lectureId] === true) {
              // Try to find lecture title and timestamp from localStorage
              const lectureInfo = JSON.parse(localStorage.getItem(`lecture_${lectureId}`) || '{}');
              if (lectureInfo) {
                completedLectures.push({
                  id: lectureId,
                  title: lectureInfo.title || 'Unknown Lecture',
                  courseTitle: lectureInfo.courseTitle || 'Unknown Course',
                  timestamp: lectureInfo.timestamp || Date.now(),
                });
              }
            }
          });
        }
      });
      
      // Sort by timestamp, most recent first
      return completedLectures.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    } catch (error) {
      console.error('Error getting recently completed lectures:', error);
      return [];
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/student/dashboard" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                Gurukul
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/student/dashboard" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/student/dashboard')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300'
                } text-sm font-medium`}
              >
                <FiHome className="mr-1" />
                Dashboard
              </Link>
              
              <Link 
                href="/student/profile" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/student/profile')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300'
                } text-sm font-medium`}
              >
                <FiPieChart className="mr-1" />
                Progress
              </Link>
              
              <Link 
                href="/profile" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/profile')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300'
                } text-sm font-medium`}
              >
                <FiUser className="mr-1" />
                Profile
              </Link>
            </div>
          </div>
          
          {/* Right side - mobile menu button, user info, logout */}
          <div className="flex items-center">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
            >
              {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
            
            {/* User info and logout - desktop */}
            <div className="hidden sm:flex sm:items-center">
              {user && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-2">
                    <span className="text-primary-700 dark:text-primary-300 font-medium text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name || user.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role === 'admin' ? (
                        <span className="text-primary-600 dark:text-primary-400">Admin</span>
                      ) : (
                        'Student'
                      )}
                    </p>
                  </div>
                  {user.role === 'admin' && (
                    <button
                      onClick={handleLogout}
                      className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FiLogOut className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <FiX className="block h-6 w-6" />
                ) : (
                  <FiMenu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/student/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/student/dashboard')
                ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <FiHome className="mr-2 h-5 w-5" />
              <span>Dashboard</span>
            </div>
          </Link>
          
          <Link
            href="/student/profile"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/student/profile')
                ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <FiPieChart className="mr-2 h-5 w-5" />
              <span>Progress</span>
            </div>
          </Link>
          
          <Link
            href="/profile"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/profile')
                ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <FiUser className="mr-2 h-5 w-5" />
              <span>Profile</span>
            </div>
          </Link>
          
          {user && user.role === 'admin' && (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <div className="flex items-center">
                <FiLogOut className="mr-2 h-5 w-5" />
                <span>Log out</span>
              </div>
            </button>
          )}
        </div>
        
        {/* Mobile user info */}
        {user && (
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-white">{user.name}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Completed */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recently Completed</h3>
          <div className="space-y-2">
            {getRecentlyCompletedLectures().length > 0 ? (
              getRecentlyCompletedLectures().map(lecture => (
                <div key={lecture.id} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800">
                  <div className="flex items-center">
                    <FiCheckCircle className="text-green-500 dark:text-green-400 mr-2 h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{lecture.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lecture.courseTitle}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No lectures completed yet</p>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 