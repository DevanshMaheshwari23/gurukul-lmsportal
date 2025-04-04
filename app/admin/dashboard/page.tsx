'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  FiUsers,
  FiBook,
  FiBarChart2,
  FiBell,
  FiPlus,
  FiUserPlus,
  FiMessageSquare
} from 'react-icons/fi';
import AdminNavbar from '../../../components/AdminNavbar';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define types
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  lastActivityAt: string;
}

interface UserActivity {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  page: string;
  timestamp: string;
}

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  completionRate: number;
  activeStudents: number;
  userGrowth: string;
  courseGrowth: string;
  enrollmentGrowth: string;
  activeStudentsGrowth: string;
}

interface ChartData {
  userGrowth: {
    labels: string[];
    data: number[];
  };
  courseEngagement: {
    labels: string[];
    data: number[];
  };
}

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4 }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
    activeStudents: 0,
    userGrowth: '0',
    courseGrowth: '0',
    enrollmentGrowth: '0',
    activeStudentsGrowth: '0'
  });
  const [chartData, setChartData] = useState<ChartData>({
    userGrowth: {
      labels: [],
      data: []
    },
    courseEngagement: {
      labels: [],
      data: []
    }
  });
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [timeframe, setTimeframe] = useState<string>('30d');

  // Fetch user and stats
  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        // Get token from local storage
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Get current user data
        try {
          const userResponse = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setUser(userResponse.data.user);
          
          // Verify user is admin
          if (userResponse.data.user.role !== 'admin') {
            router.push('/dashboard');
            return;
          }

          // Log activity
          await axios.post('/api/admin/activity', {
            action: 'view',
            page: '/admin/dashboard'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.log('Activity logging error:', err));

        } catch (error) {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        // Get dashboard statistics from API
        try {
          const statsResponse = await axios.get('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setStats(statsResponse.data.stats);
          setChartData(statsResponse.data.charts);
          
          // Fetch recent activities
          try {
            const activitiesResponse = await axios.get('/api/admin/activities', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setRecentActivities(activitiesResponse.data.activities);
          } catch (err) {
            console.error('Failed to fetch activities:', err);
            
            // Use mock activities if fetch fails
            setRecentActivities([
              {
                _id: '1',
                userId: '1',
                userName: user?.name || 'Admin User',
                action: 'viewed',
                page: 'Admin Dashboard',
                timestamp: new Date().toISOString()
              },
              {
                _id: '2',
                userId: '1',
                userName: user?.name || 'Admin User',
                action: 'created',
                page: 'New Course',
                timestamp: new Date(Date.now() - 3600000).toISOString()
              },
              {
                _id: '3',
                userId: '1',
                userName: user?.name || 'Admin User',
                action: 'updated',
                page: 'User Settings',
                timestamp: new Date(Date.now() - 7200000).toISOString()
              }
            ]);
          }
          
        } catch (error) {
          console.error('Error fetching stats:', error);
          setError('Failed to load dashboard statistics');
          
          // Set default statistics in case of error
          setStats({
            totalUsers: 0,
            totalCourses: 0,
            totalEnrollments: 0,
            completionRate: 0,
            activeStudents: 0,
            userGrowth: '0',
            courseGrowth: '0',
            enrollmentGrowth: '0',
            activeStudentsGrowth: '0'
          });

          // Set mock chart data
          setChartData({
            userGrowth: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              data: [10, 15, 18, 22, 25, 30, 35]
            },
            courseEngagement: {
              labels: ['Course A', 'Course B', 'Course C', 'Course D', 'Course E'],
              data: [85, 70, 65, 55, 40]
            }
          });

          // Set mock activities
          setRecentActivities([
            {
              _id: '1',
              userId: '1',
              userName: user?.name || 'Admin User',
              action: 'viewed',
              page: 'Admin Dashboard',
              timestamp: new Date().toISOString()
            },
            {
              _id: '2',
              userId: '1',
              userName: user?.name || 'Admin User',
              action: 'created',
              page: 'New Course',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              _id: '3',
              userId: '1',
              userName: user?.name || 'Admin User',
              action: 'updated',
              page: 'User Settings',
              timestamp: new Date(Date.now() - 7200000).toISOString()
            }
          ]);
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndStats();
  }, [router, timeframe]);

  // Format date for activities
  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Prepare chart options and data
  const userGrowthChartData = {
    labels: chartData.userGrowth.labels,
    datasets: [
      {
        label: 'New Users',
        data: chartData.userGrowth.data,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        tension: 0.4,
      },
    ],
  };

  const courseEngagementChartData = {
    labels: chartData.courseEngagement.labels,
    datasets: [
      {
        label: 'Enrolled Students',
        data: chartData.courseEngagement.data,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Create vertical bar chart options for course engagement
  const courseEngagementOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw} students`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Number of Enrolled Students',
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 12,
          },
        }
      },
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Course Name',
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 12,
          },
        }
      },
    },
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
      <AdminNavbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview of platform statistics and activity
          </p>
        </motion.div>
        
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        {/* Time Range Selector */}
        <div className="mb-6 flex justify-end space-x-2">
          {['30d', '3m', '6m', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 text-sm rounded-md ${
                timeframe === period
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {period === '30d' ? '30 Days' : ''}
              {period === '3m' ? '3 Months' : ''}
              {period === '6m' ? '6 Months' : ''}
              {period === '1y' ? '1 Year' : ''}
            </button>
          ))}
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 mr-4">
                <FiUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                <div className={`text-sm ${parseInt(stats.userGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseInt(stats.userGrowth) >= 0 ? '+' : ''}{stats.userGrowth}% from last month
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            {...fadeInUp} 
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 mr-4">
                <FiBook className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCourses}</p>
                <div className={`text-sm ${parseInt(stats.courseGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseInt(stats.courseGrowth) >= 0 ? '+' : ''}{stats.courseGrowth}% from last month
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            {...fadeInUp} 
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 mr-4">
                <FiBarChart2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrollments</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalEnrollments}</p>
                <div className={`text-sm ${parseInt(stats.enrollmentGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseInt(stats.enrollmentGrowth) >= 0 ? '+' : ''}{stats.enrollmentGrowth}% from last month
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            {...fadeInUp} 
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 mr-4">
                <FiBarChart2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completionRate}%</p>
                <div className={`text-sm ${parseInt(stats.activeStudentsGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseInt(stats.activeStudentsGrowth) >= 0 ? '+' : ''}{stats.activeStudentsGrowth}% from last month
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Charts & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Growth Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h2>
            <div className="h-64">
              <Line data={userGrowthChartData} options={chartOptions} />
            </div>
          </motion.div>
          
          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity._id} className="flex items-start">
                    <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-3 flex-shrink-0">
                      {activity.action === 'viewed' && <FiBarChart2 className="h-5 w-5" />}
                      {activity.action === 'created' && <FiPlus className="h-5 w-5" />}
                      {activity.action === 'updated' && <FiBell className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.userName} {activity.action} {activity.page}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
        
        {/* More Charts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Engagement Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Engagement</h2>
            <div className="h-64">
              <Bar data={courseEngagementChartData} options={courseEngagementOptions} />
            </div>
          </motion.div>
          
          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/courses/new')}
                className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-md text-white transition duration-150"
              >
                <span className="flex items-center">
                  <FiBook className="mr-2 h-5 w-5" />
                  Create Course
                </span>
                <FiPlus className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => router.push('/admin/announcements/new')}
                className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-md text-white transition duration-150"
              >
                <span className="flex items-center">
                  <FiBell className="mr-2 h-5 w-5" />
                  Send Announcement
                </span>
                <FiPlus className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-md text-white transition duration-150"
              >
                <span className="flex items-center">
                  <FiUsers className="mr-2 h-5 w-5" />
                  Manage Users
                </span>
                <FiPlus className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 