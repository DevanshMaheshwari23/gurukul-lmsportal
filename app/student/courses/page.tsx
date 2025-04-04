'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import { FiSearch, FiBook, FiBookOpen, FiClock, FiUser, FiPlay, FiGrid, FiList, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Lecture {
  _id: string;
  title: string;
  videoUrl: string;
  duration: number;
  isCompleted?: boolean;
}

interface Chapter {
  _id: string;
  title: string;
  lectures: Lecture[];
}

interface Section {
  _id: string;
  title: string;
  chapters: Chapter[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  sections: Section[];
  progress: number;
  instructor: {
    name: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    const fetchUserAndCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Fetch user data
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.user);
        
        // Fetch enrolled courses
        const coursesResponse = await axios.get('/api/student/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(coursesResponse.data.courses);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load your courses. Please try again later.');
        
        // If API fails, use mock data for testing UI
        setUser({
          _id: '1',
          name: 'Test Student',
          email: 'student@test.com',
          role: 'student'
        });
        
        setCourses([
          {
            _id: '1',
            title: 'Introduction to React',
            description: 'Learn the fundamentals of React.js and build modern web applications',
            thumbnail: 'https://placehold.co/600x400/3b82f6/ffffff?text=React+Course',
            progress: 35,
            instructor: { name: 'John Doe' },
            sections: []
          },
          {
            _id: '2',
            title: 'Advanced JavaScript',
            description: 'Master modern JavaScript features and patterns',
            thumbnail: 'https://placehold.co/600x400/eab308/ffffff?text=JavaScript+Course',
            progress: 68,
            instructor: { name: 'Jane Smith' },
            sections: []
          },
          {
            _id: '3',
            title: 'Full Stack Development',
            description: 'Build end-to-end applications with Node.js and React',
            thumbnail: 'https://placehold.co/600x400/10b981/ffffff?text=Full+Stack+Course',
            progress: 15,
            instructor: { name: 'Mike Johnson' },
            sections: []
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndCourses();
  }, [router]);
  
  const continueLastLecture = (courseId: string) => {
    router.push(`/student/course/${courseId}`);
  };
  
  const filteredCourses = courses.filter(course => {
    // Apply search filter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    let matchesStatus = true;
    if (filterStatus === 'in-progress') {
      matchesStatus = course.progress > 0 && course.progress < 100;
    } else if (filterStatus === 'completed') {
      matchesStatus = course.progress === 100;
    }
    
    return matchesSearch && matchesStatus;
  });
  
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-10 w-10 bg-primary-200 dark:bg-primary-700 rounded-full mb-4"></div>
              <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user || undefined} />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
              Your Courses
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* View mode and filter toggles */}
              <div className="flex gap-2">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-l-lg focus:z-10 focus:ring-2 focus:ring-primary-500 focus:text-primary-600 ${
                      viewMode === 'grid' 
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-r-lg focus:z-10 focus:ring-2 focus:ring-primary-500 focus:text-primary-600 ${
                      viewMode === 'list'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Status Filter Dropdown */}
                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent inline-flex items-center"
                  >
                    <FiFilter className="mr-2 h-4 w-4" />
                    {filterStatus === 'all' && 'All Courses'}
                    {filterStatus === 'in-progress' && 'In Progress'}
                    {filterStatus === 'completed' && 'Completed'}
                  </button>
                  
                  <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          filterStatus === 'all' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        All Courses
                      </button>
                      <button
                        onClick={() => setFilterStatus('in-progress')}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          filterStatus === 'in-progress' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => setFilterStatus('completed')}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          filterStatus === 'completed' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {filteredCourses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
              <FiBookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery 
                  ? "No courses match your search criteria" 
                  : "You haven't enrolled in any courses yet"}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <motion.div
                  key={course._id}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="relative h-44">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="w-full bg-gray-300/50 rounded-full h-2">
                        <div 
                          className={`${getProgressColor(course.progress)} h-2 rounded-full`} 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-white mt-1">{course.progress}% complete</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <FiUser className="mr-1" />
                      <span>{course.instructor.name}</span>
                    </div>
                    
                    <button
                      onClick={() => continueLastLecture(course._id)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FiPlay className="mr-2" />
                      {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map(course => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-40 flex-shrink-0">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <FiUser className="mr-1" />
                          <span className="mr-3">{course.instructor.name}</span>
                          <FiBook className="mr-1" />
                          <span>Sections: {course.sections?.length || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`${getProgressColor(course.progress)} h-2 rounded-full`} 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {course.progress}% complete
                          </p>
                        </div>
                        
                        <button
                          onClick={() => continueLastLecture(course._id)}
                          className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <FiPlay className="mr-2" />
                          {course.progress > 0 ? 'Continue' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
} 