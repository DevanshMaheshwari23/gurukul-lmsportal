'use client';

import { useState, useEffect, useRef } from 'react';
import { Notification } from '../lib/types';
import { BiBell } from 'react-icons/bi';
import Link from 'next/link';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      userId: 'user1',
      message: 'New course available: Advanced React',
      date: new Date(),
      read: false,
      link: '/courses/advanced-react'
    },
    {
      id: '2',
      userId: 'user1',
      message: 'Your "Intro to JavaScript" course is 75% complete',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: false,
      link: '/courses/intro-to-javascript'
    },
    {
      id: '3',
      userId: 'user1',
      message: 'New announcement from your instructor in "Python Basics"',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      link: '/courses/python-basics'
    }
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(n => n.id === id ? {...n, read: true} : n)
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(
      notifications.map(n => ({...n, read: true}))
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications - ${unreadCount} unread`}
      >
        <BiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 text-sm font-medium border-b flex justify-between items-center">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <Link 
                  key={notification.id}
                  href={notification.link || '#'}
                  className={`block px-4 py-3 hover:bg-gray-50 ${notification.read ? 'opacity-60' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.date).toLocaleString()}
                  </p>
                </Link>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-gray-500">
                No notifications
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 