'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Placeholder for charts - we'd use a real chart library like Chart.js or Recharts
const LineChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="h-64 relative">
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-gray-400">Chart: {title}</p>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-100 to-transparent rounded-b-lg"></div>
  </div>
);

const BarChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="h-64 relative">
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-gray-400">Chart: {title}</p>
    </div>
    <div className="flex h-1/2 items-end space-x-2 absolute bottom-0 left-0 right-0 px-4">
      {[40, 65, 30, 85, 55, 60].map((height, i) => (
        <div key={i} style={{height: `${height}%`}} className="flex-1 bg-indigo-500 rounded-t-sm"></div>
      ))}
    </div>
  </div>
);

// Mock data
const enrollmentData = [
  { name: 'Jan', users: 40 },
  { name: 'Feb', users: 30 },
  { name: 'Mar', users: 45 },
  { name: 'Apr', users: 60 },
  { name: 'May', users: 75 },
  { name: 'Jun', users: 85 },
];

const courseEngagementData = [
  { name: 'JavaScript Basics', students: 120, completionRate: 68 },
  { name: 'React Fundamentals', students: 95, completionRate: 72 },
  { name: 'Node.js API Dev', students: 85, completionRate: 56 },
  { name: 'Python for Beginners', students: 150, completionRate: 82 },
  { name: 'Data Science', students: 65, completionRate: 44 },
];

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');
  
  // Mock data for analytics
  const userEnrollmentData = [
    { date: '2023-01', count: 45 },
    { date: '2023-02', count: 52 },
    { date: '2023-03', count: 49 },
    { date: '2023-04', count: 62 },
    { date: '2023-05', count: 78 },
    { date: '2023-06', count: 94 },
    { date: '2023-07', count: 86 },
    { date: '2023-08', count: 102 },
    { date: '2023-09', count: 120 },
    { date: '2023-10', count: 135 },
    { date: '2023-11', count: 148 },
    { date: '2023-12', count: 162 },
  ];
  
  const courseEngagementData = [
    { name: 'JavaScript Fundamentals', engagement: 85 },
    { name: 'Python Basics', engagement: 78 },
    { name: 'Data Science Intro', engagement: 92 },
    { name: 'Web Development', engagement: 75 },
    { name: 'Machine Learning', engagement: 65 },
    { name: 'Mobile App Development', engagement: 70 },
  ];

  const topCourses = [
    { id: 'c1', name: 'JavaScript Fundamentals', students: 254, completion: 78, rating: 4.7 },
    { id: 'c2', name: 'Python Basics', students: 210, completion: 82, rating: 4.8 },
    { id: 'c3', name: 'Data Science Introduction', students: 198, completion: 75, rating: 4.6 },
    { id: 'c4', name: 'Web Development Bootcamp', students: 182, completion: 68, rating: 4.5 },
    { id: 'c5', name: 'Machine Learning Essentials', students: 146, completion: 64, rating: 4.4 },
  ];

  useEffect(() => {
    // In a real app, would check user role from API or token
    setTimeout(() => {
      setIsAdmin(true);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Get insights into your platform's performance and user engagement
          </p>
        </header>

        {/* Time range selector */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '30days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              30 days
            </button>
            <button
              onClick={() => setTimeRange('3months')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '3months'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              3 months
            </button>
            <button
              onClick={() => setTimeRange('6months')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '6months'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              6 months
            </button>
            <button
              onClick={() => setTimeRange('1year')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '1year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              1 year
            </button>
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {/* Analytics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">1,245</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                +12.5%
              </span>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Compared to last month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">36</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                +8.3%
              </span>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Compared to last month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">72%</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                -2.1%
              </span>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Compared to last month</p>
            </div>
          </div>
        </div>

        {/* Charts and tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User enrollment chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Enrollment</h2>
            <div className="h-64 flex items-end space-x-2">
              {userEnrollmentData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-indigo-600 rounded-t-sm hover:bg-indigo-700 transition-all duration-200"
                    style={{ height: `${(item.count / 180) * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">{item.date.split('-')[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course engagement chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Course Engagement</h2>
            <div className="h-64 flex flex-col justify-between space-y-2">
              {courseEngagementData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-xs w-32 text-gray-600 truncate">{item.name}</span>
                  <div className="ml-2 flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${item.engagement}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs font-medium text-gray-700">{item.engagement}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top performing courses */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Top Performing Courses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{course.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{course.students}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 mr-2">{course.completion}%</span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${course.completion}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-700">{course.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 