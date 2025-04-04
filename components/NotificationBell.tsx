'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationReceived, setNotificationReceived] = useState(false);
  const [animating, setAnimating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock notifications data
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'New Course Available',
        message: 'Introduction to Machine Learning is now available.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        type: 'info'
      },
      {
        id: '2',
        title: 'Assignment Graded',
        message: 'Your JavaScript Fundamentals assignment has been graded.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        type: 'success'
      },
      {
        id: '3',
        title: 'Upcoming Deadline',
        message: 'The React project is due in 2 days.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        read: true,
        type: 'warning'
      },
      {
        id: '4',
        title: 'Scheduled Maintenance',
        message: 'The platform will be down for maintenance on Sunday 2am-4am.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        type: 'error'
      }
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);

    // Simulate receiving a new notification after 5 seconds
    const timer = setTimeout(() => {
      const newNotification: Notification = {
        id: '5',
        title: 'Live Workshop',
        message: 'Don\'t miss the live coding workshop tomorrow!',
        timestamp: new Date(),
        read: false,
        type: 'info'
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setNotificationReceived(true);
      
      // Reset the animation after a short delay
      setTimeout(() => {
        setNotificationReceived(false);
      }, 1000);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => {
      if (notification.id === id && !notification.read) {
        return { ...notification, read: true };
      }
      return notification;
    });
    
    setNotifications(updatedNotifications);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Get notification color based on type
  const getNotificationColor = (type: string, isDark: boolean = false) => {
    switch (type) {
      case 'info':
        return isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'success':
        return isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'warning':
        return isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'error':
        return isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      default:
        return isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
    }
  };

  // Format time difference
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleBellClick}
        className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                   transition-all duration-200 ${notificationReceived ? 'animate-shake' : ''}`}
        aria-label="Notifications"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 text-gray-600 dark:text-gray-300 transition-colors duration-200
                    ${notificationReceived ? 'text-primary-500 dark:text-primary-400' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            className={notificationReceived ? 'animate-pulse' : ''}
          />
        </svg>
        
        {unreadCount > 0 && (
          <span 
            className={`absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 
                      text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 
                      rounded-full bg-primary-500 dark:bg-primary-600 min-w-[1.25rem] min-h-[1.25rem]
                      ${notificationReceived ? 'animate-ping-slow' : ''}`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg 
                    overflow-hidden z-50 border border-gray-200 dark:border-gray-700
                    transition-all duration-300 transform origin-top-right
                    ${animating ? 'animate-fade-in scale-100' : ''}`}
          aria-live="polite"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 
                         transition-colors duration-200"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`border-b border-gray-100 dark:border-gray-700 last:border-b-0
                              transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50
                              ${!notification.read ? 'bg-gray-50 dark:bg-gray-800/60' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex p-4 cursor-pointer">
                      <div className={`w-2 self-stretch rounded-full mr-3 ${getNotificationColor(notification.type, true)}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getNotificationColor(notification.type)}`}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </span>
                          {!notification.read && (
                            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center border-t border-gray-200 dark:border-gray-700">
            <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 