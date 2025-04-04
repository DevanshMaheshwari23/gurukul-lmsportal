'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import { useTheme } from '../../../lib/ThemeContext';
import { FiBook, FiClock, FiCheckCircle, FiAlertCircle, FiInfo, FiPlay, FiX, FiEye, FiEyeOff, FiSearch, FiBookOpen, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Lecture {
  _id: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration?: number;
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
  thumbnailUrl: string;
  sections: Section[];
  progress: number;
  totalLectures: number;
  completedLectures: number;
  lastAccessed: string;
  instructor?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  createdAt: string;
  read: boolean;
}

interface ProgressStats {
  totalLectures: number;
  completedLectures: number;
  percentComplete: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const observerRef = useRef<MutationObserver | null>(null);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string; bio?: string } | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeVideo, setActiveVideo] = useState<{
    videoUrl: string;
    lectureTitle: string;
    courseTitle: string;
    lectureId: string;
  } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [progressStats, setProgressStats] = useState<ProgressStats>({ totalLectures: 0, completedLectures: 0, percentComplete: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  
  // Adding these refs at the component level instead of inside useEffect
  const hasInitializedRef = useRef(false);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch data
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get the user data from API response
        let userData = userResponse.data.user;
        
        // Check if we have a stored bio in localStorage/sessionStorage and use it if available
        const storedBio = localStorage.getItem('userBio') || sessionStorage.getItem('userBio');
        if (storedBio && userData) {
          userData = {
            ...userData,
            bio: storedBio
          };
        }
        
        // Set the user data with potentially updated bio
        setUser(userData);
        
        // Fetch enrolled courses
        try {
          const coursesResponse = await axios.get('/api/student/courses', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setEnrolledCourses(coursesResponse.data.courses || []);
        } catch (error) {
          console.error('Error fetching enrolled courses:', error);
          
          // Use mock data if API fails
          setEnrolledCourses([
            {
              _id: '1',
              title: 'Introduction to React',
              description: 'Learn the fundamentals of React.js and build modern web applications',
              thumbnailUrl: 'https://placehold.co/600x400/3b82f6/ffffff?text=React+Course',
              sections: [
                {
                  _id: 's1',
                  title: 'Getting Started with React',
                  chapters: [
                    {
                      _id: 'c1',
                      title: 'React Fundamentals',
                      lectures: [
                        
                      ]
                    }
                  ]
                },
                {
                  _id: 's2',
                  title: 'React Hooks',
                  chapters: [
                    {
                      _id: 'c2',
                      title: 'Introduction to Hooks',
                      lectures: [
                        
                      ]
                    }
                  ]
                }
              ],
              progress: 25,
              totalLectures: 12,
              completedLectures: 8,
              lastAccessed: '2 days ago'
            }
          ]);
        }
        
        // Fetch notifications
        try {
          const notificationsResponse = await axios.get('/api/student/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setNotifications(notificationsResponse.data.notifications || []);
        } catch (error) {
          console.error('Error fetching notifications:', error);
          
          // Use mock data if API fails
          setNotifications([
            {
              id: 'n1',
              title: 'New Course Added',
              message: 'Check out our new course on Advanced JavaScript!',
              createdAt: new Date().toISOString(),
              read: false
            },
            {
              id: 'n2',
              title: 'Assignment Due',
              message: 'Your React project is due in 3 days.',
              createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              read: true
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Initialize expanded sections and chapters
  useEffect(() => {
    if (enrolledCourses.length > 0) {
      // Auto select first course if none selected
      if (!selectedCourse) {
        setSelectedCourse(enrolledCourses[0]);
      }
      
      // Auto expand first section and chapter for selected course
      const newExpandedSections: Record<string, boolean> = {};
      const newExpandedChapters: Record<string, boolean> = {};
      
      enrolledCourses.forEach(course => {
        if (course.sections.length > 0) {
          newExpandedSections[course.sections[0]._id] = true;
          
          if (course.sections[0].chapters.length > 0) {
            newExpandedChapters[course.sections[0].chapters[0]._id] = true;
          }
        }
      });
      
      setExpandedSections(newExpandedSections);
      setExpandedChapters(newExpandedChapters);
    }
  }, [enrolledCourses, selectedCourse]);

  // Function to restore notification states during component initialization
  useEffect(() => {
    // This runs when the notifications array is first populated
    if (notifications.length > 0) {
      try {
        // Load both regular and permanent notification states
        const readNotifications = getFromLocalStorage('readNotifications', []);
        const deletedNotifications = getFromLocalStorage('deletedNotifications', []);
        
        // Also check for permanent storage (these take precedence)
        const permanentReadNotifications = getFromLocalStorage('permanentReadNotifications', []);
        const permanentDeletedNotifications = getFromLocalStorage('permanentDeletedNotifications', []);
        
        // Merge with precedence to permanent states
        const mergedReadIds = [...new Set([...readNotifications, ...permanentReadNotifications])];
        const mergedDeletedIds = [...new Set([...deletedNotifications, ...permanentDeletedNotifications])];
        
        // Update localStorage with merged values
        saveToLocalStorage('readNotifications', mergedReadIds);
        saveToLocalStorage('deletedNotifications', mergedDeletedIds);
        saveToLocalStorage('permanentReadNotifications', mergedReadIds);
        saveToLocalStorage('permanentDeletedNotifications', mergedDeletedIds);
        
        // Apply these states to current notifications
        setNotifications(prevNotifications => 
          prevNotifications
            .filter(notification => !mergedDeletedIds.includes(notification.id))
            .map(notification => 
              mergedReadIds.includes(notification.id) 
                ? { ...notification, read: true } 
                : notification
            )
        );
        
        // Then try to get states from server and merge them too
        const fetchServerStates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
            const response = await axios.get('/api/student/notifications/state', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
            const { readIds, deletedIds } = response.data;
            
            // Merge with existing states
            const finalReadIds = [...new Set([...mergedReadIds, ...readIds])];
            const finalDeletedIds = [...new Set([...mergedDeletedIds, ...deletedIds])];
            
            // Update localStorage with final merged states
            saveToLocalStorage('readNotifications', finalReadIds);
            saveToLocalStorage('deletedNotifications', finalDeletedIds);
            saveToLocalStorage('permanentReadNotifications', finalReadIds);
            saveToLocalStorage('permanentDeletedNotifications', finalDeletedIds);
            
            // Apply final states to notifications
      setNotifications(prevNotifications => 
              prevNotifications
                .filter(notification => !finalDeletedIds.includes(notification.id))
                .map(notification => 
                  finalReadIds.includes(notification.id) 
                    ? { ...notification, read: true } 
                    : notification
        )
      );
    } catch (error) {
            console.error('Error fetching server notification states:', error);
          }
        };
        
        fetchServerStates();
      } catch (error) {
        console.error('Error restoring notification states:', error);
      }
    }
  }, [notifications.length]); // Only run when notifications are first loaded

  // Ensure course progress is maintained after logout/login
  useEffect(() => {
    if (typeof window !== 'undefined' && enrolledCourses.length > 0) {
      // Always prioritize permanentCourseProgress for persistence across sessions
      let permanentProgress = JSON.parse(localStorage.getItem('permanentCourseProgress') || '{}');
      let sessionProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
      
      // Merge the progress data, with permanent progress taking precedence
      const mergedProgress = { ...sessionProgress, ...permanentProgress };
      
      // Update both storage locations
      localStorage.setItem('permanentCourseProgress', JSON.stringify(mergedProgress));
      localStorage.setItem('courseProgress', JSON.stringify(mergedProgress));
      
      if (Object.keys(mergedProgress).length > 0) {
        const updatedCourses = enrolledCourses.map(course => {
          // If we have saved progress for this course
          if (mergedProgress[course._id]) {
            const savedProgress = mergedProgress[course._id];
            
            // Update lecture completion status
            if (savedProgress.lectures) {
              course.sections.forEach(section => {
                section.chapters.forEach(chapter => {
                  chapter.lectures.forEach(lecture => {
                    if (savedProgress.lectures[lecture._id] !== undefined) {
                      lecture.isCompleted = savedProgress.lectures[lecture._id];
                    }
                  });
                });
              });
            }
            
            // Update course progress
            return {
              ...course,
              completedLectures: savedProgress.completedLectures || course.completedLectures,
              progress: savedProgress.progress || course.progress
            };
          }
          
          return course;
        });
        
        setEnrolledCourses(updatedCourses);
        
        // If a course is selected, recalculate its progress
        if (selectedCourse) {
          const updatedCourse = updatedCourses.find(c => c._id === selectedCourse._id);
          if (updatedCourse) {
            calculateProgress(updatedCourse);
          }
        }
      }
    }
  }, [enrolledCourses.length]); // Only run once when enrolled courses are loaded

  // Initialize showProgress from localStorage
  useEffect(() => {
    const savedShowProgress = localStorage.getItem('showProgress');
    if (savedShowProgress === 'true') {
      setShowProgress(true);
    }
  }, []);

  // Save showProgress state when it changes
  useEffect(() => {
    localStorage.setItem('showProgress', String(showProgress));
  }, [showProgress]);

  // Helper functions for localStorage operations to ensure better persistence
  const saveToLocalStorage = (key: string, value: any) => {
    try {
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
      localStorage.setItem(key, valueToStore);
      return true;
      } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      return false;
    }
  };

  const getFromLocalStorage = (key: string, defaultValue: any = null) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      
      try {
        return JSON.parse(stored);
      } catch {
        // If not valid JSON, return as string
        return stored;
      }
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  };

  // Update syncNotificationStates to make it more robust
  const syncNotificationStates = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Get read and deleted notification IDs from localStorage
      const readNotifications = getFromLocalStorage('readNotifications', []);
      const deletedNotifications = getFromLocalStorage('deletedNotifications', []);
      
      // Store in multiple storage locations for redundancy
      saveToLocalStorage('readNotifications', readNotifications);
      saveToLocalStorage('permanentReadNotifications', readNotifications);
      saveToLocalStorage('deletedNotifications', deletedNotifications);
      saveToLocalStorage('permanentDeletedNotifications', deletedNotifications);
      
      // Session storage for instant recovery after redirects
      sessionStorage.setItem('readNotifications', JSON.stringify(readNotifications));
      sessionStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
      
      // Only sync with server if it's been at least 5 seconds since last sync
      const lastSyncTime = parseInt(localStorage.getItem('lastNotificationSyncTime') || '0');
      const currentTime = Date.now();
      
      if (currentTime - lastSyncTime > 5000) {
        await axios.post('/api/student/notifications/state', {
          readIds: readNotifications,
          deletedIds: deletedNotifications
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
        // Update last sync time
        localStorage.setItem('lastNotificationSyncTime', currentTime.toString());
        console.log('Notification states synced with server');
      }
    } catch (error) {
      console.error('Error syncing notification states:', error);
    }
  }, []);

  // Function to sync all states but with protections against excessive calls
  const syncAllStates = useCallback(async () => {
    // Check if we've recently synced to prevent excessive calls
    const lastSyncTime = parseInt(localStorage.getItem('lastAllStatesSyncTime') || '0');
    const currentTime = Date.now();
    
    // Only sync if it's been at least 3 seconds since last sync
    if (currentTime - lastSyncTime > 3000) {
      // Sync notification states with the server
      await syncNotificationStates();
      
      // Save courseProgress to permanentCourseProgress
      const courseProgress = localStorage.getItem("courseProgress");
      if (courseProgress) {
        localStorage.setItem("permanentCourseProgress", courseProgress);
      }
      
      // Update last sync time
      localStorage.setItem('lastAllStatesSyncTime', currentTime.toString());
      
      console.log("All states synced at:", new Date().toISOString());
    }
  }, [syncNotificationStates]);

  // Now add the useEffect hooks here, after syncAllStates is defined
  // Fix localStorage persistence on page navigation/redirection
  useEffect(() => {
    // Track route changes
    if (pathname !== prevPathRef.current) {
      console.log("Route changed, syncing states before navigation");
      prevPathRef.current = pathname;
      syncAllStates();
    }
  }, [pathname, syncAllStates]);

  // Add MutationObserver to detect DOM changes that might indicate navigation
  useEffect(() => {
    // Create an observer to watch for DOM changes that might indicate navigation
    if (typeof window !== 'undefined' && !observerRef.current) {
      observerRef.current = new MutationObserver((mutations) => {
        // If there are significant DOM changes, sync states
        if (mutations.some(m => m.addedNodes.length > 5 || m.removedNodes.length > 5)) {
          console.log("Significant DOM changes detected, syncing states");
          syncAllStates();
        }
      });
      
      // Start observing the document body
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
    
    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [syncAllStates]);

  // Add page unload listener for final sync
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Final sync before page unload
      syncAllStates();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [syncAllStates]);

  // Enhanced synchronization mechanism that checks for states immediately on component mount
  // Modified to prevent infinite update loops
  useEffect(() => {
    // Function to load all states from localStorage and API
    const loadAllStates = async () => {
      if (hasInitializedRef.current) return; // Skip if already initialized
      
      console.log("Loading all states on component mount");
      hasInitializedRef.current = true;
      
      try {
        // First restore notification states from localStorage
        const readNotifications = getFromLocalStorage('readNotifications', []);
        const deletedNotifications = getFromLocalStorage('deletedNotifications', []);
        
        // Apply localStorage states to current notifications
        if (notifications.length > 0) {
          setNotifications(prevNotifications => 
            prevNotifications
              .filter(notification => !deletedNotifications.includes(notification.id))
              .map(notification => 
                readNotifications.includes(notification.id) 
                  ? { ...notification, read: true } 
                  : notification
              )
          );
        }
        
        // Then restore courseProgress
        let courseProgress = getFromLocalStorage('courseProgress', {});
        let permanentCourseProgress = getFromLocalStorage('permanentCourseProgress', {});
        
        // Merge progress data, with permanent taking precedence
        const mergedProgress = { ...courseProgress, ...permanentCourseProgress };
        
        // Update localStorage with merged data to ensure consistency
        saveToLocalStorage('courseProgress', mergedProgress);
        saveToLocalStorage('permanentCourseProgress', mergedProgress);
        
        // Apply to enrolled courses
        if (enrolledCourses.length > 0 && Object.keys(mergedProgress).length > 0) {
        setEnrolledCourses(prevCourses => {
          return prevCourses.map(course => {
              if (mergedProgress[course._id]) {
                const savedProgress = mergedProgress[course._id];
                
                // Update lecture completion states
                if (savedProgress.lectures) {
                  course.sections.forEach(section => {
                    section.chapters.forEach(chapter => {
                      chapter.lectures.forEach(lecture => {
                        if (savedProgress.lectures[lecture._id] !== undefined) {
                          lecture.isCompleted = savedProgress.lectures[lecture._id];
                        }
                      });
                    });
                  });
                }
                
                // Update course progress metrics
                return {
                  ...course,
                  completedLectures: savedProgress.completedLectures || course.completedLectures,
                  totalLectures: savedProgress.totalLectures || course.totalLectures,
                  progress: savedProgress.progress || course.progress
                };
              }
              return course;
            });
          });
          
          // If there's a selected course, recalculate its progress
          if (selectedCourse) {
            const updatedCourse = enrolledCourses.find(c => c._id === selectedCourse._id);
            if (updatedCourse) {
              calculateProgress(updatedCourse);
            }
          }
        }
        
        // Save current time as last sync time to prevent immediate re-sync
        localStorage.setItem('lastNotificationSyncTime', Date.now().toString());
        localStorage.setItem('lastAllStatesSyncTime', Date.now().toString());
      } catch (error) {
        console.error("Error loading all states:", error);
      }
    };
    
    // Load all states immediately on component mount
    loadAllStates();
    
    // Handle visibility change with debounce
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any existing timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        // Set a timeout to prevent multiple rapid executions
        visibilityTimeoutRef.current = setTimeout(() => {
          console.log("Page became visible, syncing states");
          syncAllStates();
          visibilityTimeoutRef.current = null;
        }, 1000);
      }
    };
    
    // Add the event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      // Remove event listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear any pending timeout
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      
      // Do one final sync on unmount, but with a guard
      const lastSyncTime = parseInt(localStorage.getItem('lastAllStatesSyncTime') || '0');
      const currentTime = Date.now();
      
      if (currentTime - lastSyncTime > 3000) {
        // Final sync when component unmounts
        syncAllStates();
      }
    };
  // Important: Don't include syncAllStates in dependency array as it would cause infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledCourses.length, selectedCourse?._id, notifications.length]);

  // Style helper functions for UI components
  const cardStyle = "bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-black/25 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md dark:hover:shadow-black/40";

  const getNotificationCardStyle = (isRead: boolean) => {
    return `p-3 rounded-lg border transition-all duration-300 ${
      isRead 
        ? 'border-gray-200 dark:border-gray-700 hover:shadow-sm dark:hover:shadow-black/20' 
        : 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 hover:shadow-md dark:hover:shadow-black/30'
    }`;
  };

  const getCheckboxStyle = (isChecked: boolean | undefined) => {
    return `flex items-center justify-center w-5 h-5 border ${
      isChecked
        ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600 shadow-sm dark:shadow-green-900/30'
        : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 group-hover:border-green-400 dark:group-hover:border-green-500 shadow-sm dark:shadow-black/20'
    } rounded transition-all duration-200`;
  };

  // Additional style helpers
  const sectionHeadingStyle = "text-xl font-bold text-gray-900 dark:text-white mb-4";
  const buttonPrimaryStyle = "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md dark:bg-primary-600 dark:hover:bg-primary-700 dark:shadow-primary-900/30 transition-all duration-300";
  const buttonSecondaryStyle = "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm hover:shadow-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200 dark:shadow-black/30 transition-all duration-300";

  // Helper function for notification icon
  function getNotificationIcon(type: string) {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheckCircle className="h-5 w-5" />,
          color: 'text-green-500 dark:text-green-400'
        };
      case 'warning':
        return {
          icon: <FiAlertCircle className="h-5 w-5" />,
          color: 'text-yellow-500 dark:text-yellow-400'
        };
      case 'announcement':
        return {
          icon: <FiInfo className="h-5 w-5" />,
          color: 'text-blue-500 dark:text-blue-400'
        };
      default:
        return {
          icon: <FiInfo className="h-5 w-5" />,
          color: 'text-blue-500 dark:text-blue-400'
        };
    }
  }

  // Add the function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update local state first for immediate UI feedback
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
      
      // Update localStorage with all notification IDs
      const readIds = notifications.map(n => n.id);
      saveToLocalStorage('readNotifications', readIds);
      
      // Sync with server
      await syncNotificationStates();
      
      // Show success message
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Enhanced toggle lecture completion to ensure checkbox state persistence and track completed lecture info
  const toggleLectureCompletion = async (lectureId: string, isCompleted: boolean, courseId?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // If we know the courseId, check if user is enrolled first
      if (courseId) {
        const isEnrolled = enrolledCourses.some(course => course._id === courseId);
        if (!isEnrolled) {
          // Show enrollment prompt instead of error
          toast.error('You need to enroll in this course first');
          return;
        }
      }
      
      // Update local state first for immediate UI feedback
      setEnrolledCourses(prevCourses => {
        let lectureTitle = '';
        let courseTitle = '';
        
        const newCourses = prevCourses.map(course => {
            let courseUpdated = false;
            
            // Check if this lecture is in this course
            for (const section of course.sections) {
              for (const chapter of section.chapters) {
                for (const lecture of chapter.lectures) {
                  if (lecture._id === lectureId) {
                  lecture.isCompleted = !isCompleted;
                    courseUpdated = true;
                  
                  // Store lecture info for navbar display
                  lectureTitle = lecture.title;
                  courseTitle = course.title;
                  
                    break;
                  }
                }
                if (courseUpdated) break;
              }
              if (courseUpdated) break;
            }
            
            if (courseUpdated) {
            // Count actual completed lectures after the update
            let completedCount = 0;
            let totalCount = 0;
            
            course.sections.forEach(section => {
              section.chapters.forEach(chapter => {
                chapter.lectures.forEach(lecture => {
                  totalCount++;
                  if (lecture.isCompleted) {
                    completedCount++;
                  }
                });
              });
            });
            
            const progress = Math.round((completedCount / totalCount) * 100);
            
            // Save completion to localStorage for persistence even after logout
            const localCourseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
            localCourseProgress[course._id] = {
              completedLectures: completedCount,
              totalLectures: totalCount,
              progress,
              lectures: localCourseProgress[course._id]?.lectures || {}
            };
            localCourseProgress[course._id].lectures[lectureId] = !isCompleted;
            
            // Save to both regular and permanent localStorage
            localStorage.setItem('courseProgress', JSON.stringify(localCourseProgress));
            localStorage.setItem('permanentCourseProgress', JSON.stringify(localCourseProgress));
            
            // Store lecture info with timestamp for recently completed display
            if (!isCompleted) { // Only when marking as completed
              localStorage.setItem(`lecture_${lectureId}`, JSON.stringify({
                title: lectureTitle,
                courseTitle: courseTitle,
                timestamp: Date.now()
              }));
              
              // Also store in sessionStorage for better persistence during navigation
              sessionStorage.setItem(`lecture_${lectureId}`, JSON.stringify({
                title: lectureTitle,
                courseTitle: courseTitle,
                timestamp: Date.now()
              }));
            }
            
            // If this is the currently selected course, update the progress stats
            if (selectedCourse && course._id === selectedCourse._id) {
              setProgressStats({
                totalLectures: totalCount,
                completedLectures: completedCount,
                percentComplete: progress
              });
            }
            
              return {
                ...course,
              completedLectures: completedCount,
              totalLectures: totalCount,
              progress
              };
            }
            
            return course;
          });
        
        return newCourses;
      });
      
      // Call API in the background
      try {
        const response = await axios.patch(`/api/student/lectures/${lectureId}`, {
          completed: !isCompleted
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Force sync to ensure data is saved
          syncAllStates();
        }
      } catch (error) {
        console.error('API Error toggling lecture completion:', error);
        // Even on API error, we keep the local state changes for better UX
      }
    } catch (error) {
      console.error('Error toggling lecture completion:', error);
    }
  };

  // Function to check if a lecture is completed by its ID
  const isLectureCompletedById = (lectureId: string): boolean => {
    if (!selectedCourseData) return false;
    
    // Check through all sections, chapters, lectures to find the matching lecture
    for (const section of selectedCourseData.sections) {
      for (const chapter of section.chapters) {
        for (const lecture of chapter.lectures) {
          if (lecture._id === lectureId) {
            return !!lecture.isCompleted;
          }
        }
      }
    }
    
    // If we can't find the lecture in the course structure, check localStorage as fallback
    try {
      const courseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
      const selectedCourseId = selectedCourseData._id;
      
      if (courseProgress[selectedCourseId]?.lectures?.[lectureId] !== undefined) {
        return !!courseProgress[selectedCourseId].lectures[lectureId];
      }
    } catch (error) {
      console.error('Error checking lecture completion from localStorage:', error);
    }
    
    return false;
  };

  // Function to calculate course progress
  const calculateProgress = (course: Course) => {
    let totalLectures = 0;
    let completedLectures = 0;
    
    course.sections.forEach(section => {
      section.chapters.forEach(chapter => {
        chapter.lectures.forEach(lecture => {
          totalLectures++;
          if (lecture.isCompleted) {
            completedLectures++;
          }
        });
      });
    });
    
    const percentComplete = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    setProgressStats({
      totalLectures,
      completedLectures,
      percentComplete
    });
    
    // Update the course object itself for consistency
    course.completedLectures = completedLectures;
    course.totalLectures = totalLectures;
    course.progress = percentComplete;
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpandedSections = {
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    };
    setExpandedSections(newExpandedSections);
    localStorage.setItem('expandedSections', JSON.stringify(newExpandedSections));
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    const newExpandedChapters = {
      ...expandedChapters,
      [chapterId]: !expandedChapters[chapterId]
    };
    setExpandedChapters(newExpandedChapters);
    localStorage.setItem('expandedChapters', JSON.stringify(newExpandedChapters));
  };

  // Handle play video button click
  const handlePlayVideo = (videoUrl: string, lectureTitle: string, courseTitle: string, lectureId: string) => {
    // Extract YouTube video ID
    let videoId = '';
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1];
    }
    
    if (videoId.includes('&')) {
      videoId = videoId.split('&')[0];
    }
    
    setActiveVideo({
      videoUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      lectureTitle,
      courseTitle,
      lectureId
    });
    
    // Store lecture info for navbar display regardless of completion status
    localStorage.setItem(`lecture_${lectureId}`, JSON.stringify({
      title: lectureTitle,
      courseTitle: courseTitle,
      timestamp: Date.now(),
      lastViewed: true
    }));
    
    // Also store in sessionStorage for better persistence
    sessionStorage.setItem(`lecture_${lectureId}`, JSON.stringify({
      title: lectureTitle,
      courseTitle: courseTitle,
      timestamp: Date.now(),
      lastViewed: true
    }));
    
    // Scroll to video player
    setTimeout(() => {
      videoContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Close active video handler
  const closeActiveVideo = () => {
    setActiveVideo(null);
    localStorage.removeItem('activeVideo'); // Remove from localStorage
  };

  // Video modal handlers
  const openVideoModal = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setVideoModalOpen(true);
    localStorage.setItem('selectedLecture', JSON.stringify(lecture));
    localStorage.setItem('videoModalOpen', 'true');
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedLecture(null);
    localStorage.removeItem('selectedLecture');
    localStorage.removeItem('videoModalOpen');
  };

  // Add missing functions
  // Enhanced markNotificationAsRead with protection against excessive syncs
  const markNotificationAsRead = async (id: string) => {
    try {
      // Update local state first for immediate UI feedback
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      // Update both regular and permanent localStorage to ensure it persists across sessions
      const readNotifications = getFromLocalStorage('readNotifications', []);
      if (!readNotifications.includes(id)) {
        readNotifications.push(id);
        saveToLocalStorage('readNotifications', readNotifications);
        saveToLocalStorage('permanentReadNotifications', readNotifications);
      }
      
      // Try to update on server
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.patch('/api/student/notifications', { id }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Only sync if it's been a while since last sync
          const lastSyncTime = parseInt(localStorage.getItem('lastNotificationSyncTime') || '0');
          const currentTime = Date.now();
          
          if (currentTime - lastSyncTime > 5000) {
            syncNotificationStates();
          }
        } catch (error) {
          console.error('API Error marking notification as read:', error);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Enhanced deleteNotification with protection against excessive syncs
  const deleteNotification = async (id: string) => {
    try {
      // First mark as read to ensure state consistency
      await markNotificationAsRead(id);
      
      // Update local state immediately
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update both regular and permanent localStorage
      const deletedNotifications = getFromLocalStorage('deletedNotifications', []);
      if (!deletedNotifications.includes(id)) {
        deletedNotifications.push(id);
        saveToLocalStorage('deletedNotifications', deletedNotifications);
        saveToLocalStorage('permanentDeletedNotifications', deletedNotifications);
      }
      
      // Try deleting via API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.delete(`/api/student/notifications/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Only sync if it's been a while since last sync
          const lastSyncTime = parseInt(localStorage.getItem('lastNotificationSyncTime') || '0');
          const currentTime = Date.now();
          
          if (currentTime - lastSyncTime > 5000) {
            syncNotificationStates();
          }
        } catch (error) {
          console.error('Delete API failed:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Function to load lecture completion data from all sources
  const loadLectureCompletionData = useCallback(() => {
    try {
      // Sync localStorage data with sessionStorage to ensure consistency
      const courseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
      const lectureKeys = Object.keys(localStorage).filter(key => key.startsWith('lecture_'));
      
      // Store all lecture data in sessionStorage
      lectureKeys.forEach(key => {
        const lectureData = localStorage.getItem(key);
        if (lectureData) {
          sessionStorage.setItem(key, lectureData);
        }
      });
      
      // Also sync back from sessionStorage to localStorage
      // This ensures we don't lose data during client-side navigation
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('lecture_'));
      sessionKeys.forEach(key => {
        const sessionData = sessionStorage.getItem(key);
        if (sessionData) {
          localStorage.setItem(key, sessionData);
        }
      });
      
      // Store the current timestamp for sync time tracking
      const syncTime = Date.now();
      localStorage.setItem('lastLectureSyncTime', syncTime.toString());
      sessionStorage.setItem('lastLectureSyncTime', syncTime.toString());
    } catch (error) {
      // Error handling without logging
    }
  }, []);

  // Add this to your existing useEffect for initializing data
  useEffect(() => {
    // Load lecture data when component mounts
    loadLectureCompletionData();
    
    // Also set up a listener for when the user comes back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadLectureCompletionData();
      }
    };
    
    // Add a storage event listener to sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && (event.key.startsWith('lecture_') || event.key === 'courseProgress')) {
        loadLectureCompletionData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for navigation events
    window.addEventListener('popstate', loadLectureCompletionData);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', loadLectureCompletionData);
    };
  }, [loadLectureCompletionData]);

  // Enhanced navigation event handling
  useEffect(() => {
    // Handler for navigation events
    const handleNavigationEvent = () => {
      console.log("Navigation event detected, syncing all states");
      syncAllStates();
    };

    // Handler for popstate (browser back/forward navigation)
    const handlePopState = () => {
      console.log("Browser navigation detected (popstate), syncing all states");
      syncAllStates();
      
      // When coming back to the page, reload states from storage
      setTimeout(() => {
        // If user has a bio in storage, update the user object
        const storedBio = localStorage.getItem('userBio') || sessionStorage.getItem('userBio');
        if (storedBio && user) {
          setUser(prev => prev ? {...prev, bio: storedBio} : null);
        }
        
        // Reload notification states
        const readIds = getFromLocalStorage('readNotifications', []);
        const deletedIds = getFromLocalStorage('deletedNotifications', []);
        
        setNotifications(prevNotifications => 
          prevNotifications
            .filter(notification => !deletedIds.includes(notification.id))
            .map(notification => 
              readIds.includes(notification.id) 
                ? { ...notification, read: true } 
                : notification
            )
        );
      }, 100);
    };

    // Handler for beforeunload (page refresh/close)
    const handleBeforeUnload = () => {
      console.log("Page unload detected, final sync of all states");
      syncAllStates();
    };
    
    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Attach to router events if using Next.js router
    if (typeof window !== 'undefined') {
      // Add listeners to link clicks that might navigate away
      const handleLinkClick = (e: MouseEvent) => {
        const target = (e.target as Element).closest('a');
        if (target && (target as HTMLAnchorElement).href && !(target as HTMLAnchorElement).href.startsWith('javascript:') && !e.ctrlKey && !e.metaKey) {
          handleNavigationEvent();
        }
      };
      
      document.addEventListener('click', handleLinkClick);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('click', handleLinkClick);
        
        // Final sync when component unmounts
        syncAllStates();
      };
    }
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Final sync when component unmounts
      syncAllStates();
    };
  }, [user, syncAllStates]);

  // Enhanced useEffect to check bio when user object updates
  useEffect(() => {
    if (user) {
      // Check if we have a stored bio and it's different from current user bio
      const storedBio = localStorage.getItem('userBio') || sessionStorage.getItem('userBio');
      if (storedBio && storedBio !== user.bio) {
        setUser(prev => prev ? {...prev, bio: storedBio} : null);
      }
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

  const selectedCourseData = enrolledCourses.find(course => course._id === selectedCourse?._id) || null;

  // Update dark mode styling for consistent appearance
  const sectionStyle = "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200";
  const chapterStyle = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200";
  const tableBgStyle = "bg-white dark:bg-gray-800";
  const tableHeaderStyle = "bg-gray-100 dark:bg-gray-750";
  const tableRowHoverStyle = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200";
  const textPrimaryStyle = "text-gray-900 dark:text-white";
  const textSecondaryStyle = "text-gray-600 dark:text-gray-400";
  const headingStyle = "text-md font-medium text-gray-900 dark:text-white";
  const subHeadingStyle = "text-sm font-medium text-gray-800 dark:text-gray-200";
  const dividerStyle = "border-gray-200 dark:border-gray-700";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user || undefined} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
            <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name || 'Student'}. Continue your learning journey.
          </p>
            {user?.bio && (
              <p className="text-gray-500 dark:text-gray-400 italic border-l-2 border-primary-300 dark:border-primary-600 pl-2 transition-all duration-300 max-w-md">
                "{user.bio}"
              </p>
            )}
          </div>
        </motion.div>

        {/* Video Player Modal */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div
              ref={videoContainerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm"
            >
              <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-black/50 overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {activeVideo.lectureTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeVideo.courseTitle}
                    </p>
                  </div>
                  <button
                    onClick={() => closeActiveVideo()}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <div className="aspect-w-16 aspect-h-9 w-full max-h-[70vh]">
                  <iframe
                    src={activeVideo.videoUrl}
                    title={activeVideo.lectureTitle}
                    allowFullScreen
                    className="w-full h-full"
                    style={{ aspectRatio: '16/9' }}
                  ></iframe>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <button
                    onClick={() => toggleLectureCompletion(
                      activeVideo.lectureId,
                      isLectureCompletedById(activeVideo.lectureId),
                      selectedCourseData?._id
                    )}
                    className="group flex items-center transition-colors duration-200"
                    aria-label={isLectureCompletedById(activeVideo.lectureId) ? "Mark as incomplete" : "Mark as complete"}
                  >
                    <div className={getCheckboxStyle(isLectureCompletedById(activeVideo.lectureId))}>
                      {isLectureCompletedById(activeVideo.lectureId) && <FiCheck className="h-3 w-3 text-white" />}
                    </div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors duration-200">
                      {isLectureCompletedById(activeVideo.lectureId) ? 'Completed' : 'Mark complete'}
                    </span>
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Progress: {progressStats.percentComplete}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Enrolled Courses */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Selection Dropdown */}
            <div className="mb-8">
              <h2 className={sectionHeadingStyle}>Course Selection</h2>
              
              {/* Course Selection Tabs */}
              <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
                {enrolledCourses.map(course => (
                  <button
                    key={course._id}
                    onClick={() => {
                      setSelectedCourse(course);
                      calculateProgress(course);
                      localStorage.setItem('selectedCourseId', course._id);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium shrink-0 ${
                      selectedCourse?._id === course._id
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cardStyle}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={sectionHeadingStyle}>Course Progress</h2>
                    <button
                  onClick={() => {
                    setShowProgress(!showProgress);
                    if (!showProgress) {
                      document.getElementById('progress-details')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={buttonSecondaryStyle + " px-4 py-2 rounded-md text-sm font-medium"}
                >
                  {showProgress ? 'Hide Progress Details' : 'View Progress Details'}
                    </button>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <FiBook className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You haven't enrolled in any courses yet.
                  </p>
                  <Link href="/courses" className="btn-gradient text-sm py-2 px-4">
                    Browse Courses
                  </Link>
                </div>
              ) : selectedCourseData ? (
                <div className="space-y-4">
                      {/* Course Progress Bar */}
                      <div className="mb-6 group">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200">Course Progress</span>
                          <span className="font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                        {selectedCourseData.completedLectures}/{selectedCourseData.totalLectures} checkboxes
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-all duration-300">
                          <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500 rounded-full transition-all duration-500 ease-in-out group-hover:from-primary-600 group-hover:to-primary-700 dark:group-hover:from-primary-500 dark:group-hover:to-primary-600"
                            style={{ width: `${selectedCourseData.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Course Sections and Chapters */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedCourseData.sections.map((section) => (
                      <div key={section._id} className="overflow-hidden transition-all duration-300 ease-in-out">
                            {/* Section Header */}
                            <button
                          className={`flex w-full justify-between items-center p-4 ${sectionStyle} text-left`}
                              onClick={() => toggleSection(section._id)}
                            >
                              <h3 className={headingStyle}>
                                {section.title}
                              </h3>
                              <svg
                            className={`h-5 w-5 transform ${expandedSections[section._id] ? 'rotate-180' : ''} text-gray-500 dark:text-gray-400 transition-transform duration-200`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                            </button>
                            
                            {/* Section Content - Chapters */}
                            {expandedSections[section._id] && (
                              <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                            {section.chapters.map((chapter) => (
                              <div key={chapter._id} className="overflow-hidden transition-all duration-300 ease-in-out">
                                    {/* Chapter Header */}
                                    <button
                                  className={`flex w-full justify-between items-center p-3 pl-8 ${chapterStyle} text-left`}
                                      onClick={() => toggleChapter(chapter._id)}
                                    >
                                      <h4 className={subHeadingStyle}>
                                        {chapter.title}
                                      </h4>
                                      <svg
                                    className={`h-4 w-4 transform ${expandedChapters[chapter._id] ? 'rotate-180' : ''} text-gray-500 dark:text-gray-400 transition-transform duration-200`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                      </svg>
                                    </button>
                                    
                                    {/* Chapter Content - Lectures */}
                                    {expandedChapters[chapter._id] && (
                                      <div className="bg-gray-50 dark:bg-gray-850">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                          <thead className={tableHeaderStyle}>
                                            <tr>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Lecture
                                              </th>
                                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className={tableBgStyle + " divide-y " + dividerStyle}>
                                        {chapter.lectures.map((lecture) => (
                                              <tr key={lecture._id} className={tableRowHoverStyle}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <button
                                                onClick={() => toggleLectureCompletion(lecture._id, lecture.isCompleted || false, selectedCourseData?._id)}
                                                className="group flex items-center transition-colors duration-200"
                                                aria-label={lecture.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                              >
                                                <div className={getCheckboxStyle(lecture.isCompleted)}>
                                                  {lecture.isCompleted && (
                                                    <FiCheck className="h-3 w-3 text-white" />
                                                  )}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors duration-200">
                                                  {lecture.isCompleted ? 'Completed' : 'Mark complete'}
                                                </span>
                                                  </button>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <div className={textPrimaryStyle + " text-sm font-medium"}>
                                                    {lecture.title}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                              {lecture.videoUrl && selectedCourseData && (
                                                    <button
                                                      onClick={() => handlePlayVideo(
                                                        lecture.videoUrl || '',
                                                        lecture.title,
                                                        selectedCourseData.title,
                                                        lecture._id
                                                      )}
                                                      className="inline-flex items-center justify-center p-1.5 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800 transition-colors duration-200"
                                                    >
                                                      <FiPlay className="h-4 w-4" />
                                                    </button>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Select a course to view details</p>
                </div>
              )}
            </motion.div>

            {/* Progress Information (conditionally shown) */}
            {showProgress && selectedCourseData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cardStyle}
                id="progress-details"
              >
                <h2 className={sectionHeadingStyle}>Learning Progress</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-100 dark:border-primary-800 shadow-sm dark:shadow-primary-900/20 transition-all duration-200 hover:shadow-md dark:hover:shadow-primary-900/30">
                    <div className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-1">
                      {selectedCourseData.completedLectures}/{selectedCourseData.totalLectures}
                    </div>
                    <div className="text-sm text-primary-700 dark:text-primary-300">Checkboxes Checked</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 shadow-sm dark:shadow-green-900/20 transition-all duration-200 hover:shadow-md dark:hover:shadow-green-900/30">
                    <div className="text-xl font-bold text-green-900 dark:text-green-100 mb-1">
                      {selectedCourseData.progress}%
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Course Progress</div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm dark:shadow-blue-900/20 transition-all duration-200 hover:shadow-md dark:hover:shadow-blue-900/30">
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                      {(() => {
                        // Find the latest completed lecture
                        let lastCompletedLecture = '';
                        
                        for (const section of selectedCourseData.sections) {
                          for (const chapter of section.chapters) {
                            for (const lecture of chapter.lectures) {
                              if (lecture.isCompleted) {
                                lastCompletedLecture = lecture.title;
                              }
                            }
                          }
                        }
                        
                        return lastCompletedLecture || 'No lectures completed';
                      })()}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Last Completed</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm text-blue-700 dark:text-blue-300 shadow-sm">
                  <FiInfo className="inline-block mr-2" />
                  Mark lectures as completed to track your progress. Your progress is saved automatically.
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Notifications */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cardStyle}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={sectionHeadingStyle}>Notifications</h2>
                <button
                  onClick={markAllAsRead}
                  className={buttonSecondaryStyle + " px-3 py-1 rounded text-xs"}
                  disabled={notifications.length === 0 || notifications.every(n => n.read)}
                >
                  Mark All as Read
                </button>
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={getNotificationCardStyle(notification.read)}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`flex items-start ${getNotificationIcon(notification.title).color}`}>
                          {getNotificationIcon(notification.title).icon}
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markNotificationAsRead(notification.id)}
                              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      
      {/* Video Modal */}
      <AnimatePresence>
        {videoModalOpen && selectedLecture && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full mx-auto"
            >
              <div className="relative">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedLecture.title}</h3>
                <button
                  onClick={closeVideoModal}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                    <FiX size={24} />
                </button>
                </div>
                
                <div className="aspect-w-16 aspect-h-9 w-full" style={{ height: 'calc(min(70vh, 70vw * 9/16))' }}>
                  <iframe
                    ref={videoRef}
                    className="w-full h-full"
                    src={selectedLecture.videoUrl}
                    title={selectedLecture.title}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="mt-2 flex justify-between items-center">
                    <button
                      onClick={() => {
                        toggleLectureCompletion(selectedLecture._id, !!selectedLecture.isCompleted, selectedCourseData?._id);
                        closeVideoModal();
                      }}
                      className="group flex items-center transition-colors duration-200"
                      aria-label={selectedLecture.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                    >
                      <div className={getCheckboxStyle(selectedLecture.isCompleted)}>
                        {selectedLecture.isCompleted && (
                          <FiCheck className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors duration-200">
                        {selectedLecture.isCompleted ? 'Completed' : 'Mark complete'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 