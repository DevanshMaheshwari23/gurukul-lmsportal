'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiHome, 
  FiBook, 
  FiUsers, 
  FiBell, 
  FiMenu, 
  FiX, 
  FiLogOut, 
  FiMoon, 
  FiSun
} from 'react-icons/fi';

interface AdminNavbarProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
    avatar?: string;
  } | null;
}

export default function AdminNavbar({ user }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Detect scroll for shadow
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path === '/admin/dashboard' && pathname === '/admin/dashboard') return true;
    if (path === '/admin/courses' && pathname.startsWith('/admin/courses')) return true;
    if (path === '/admin/users' && pathname.startsWith('/admin/users')) return true;
    if (path === '/admin/announcements' && pathname.startsWith('/admin/announcements')) return true;
    return false;
  };

  return (
    <nav className={`bg-white dark:bg-gray-800 fixed w-full z-30 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="relative flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <FiX className="block h-5 w-5" />
              ) : (
                <FiMenu className="block h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/admin/dashboard" className="text-lg font-bold text-primary-600 dark:text-primary-400 flex items-center">
              Gurukul
              <span className="ml-1.5 text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-1.5 py-0.5 rounded-md">
                Admin
              </span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:ml-4">
            <div className="flex space-x-2">
              <Link
                href="/admin/dashboard"
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium ${
                  isActive('/admin/dashboard')
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center">
                  <FiHome className="mr-1 h-3.5 w-3.5" />
                  Dashboard
                </span>
              </Link>
              
              <Link
                href="/admin/courses"
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium ${
                  isActive('/admin/courses')
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center">
                  <FiBook className="mr-1 h-3.5 w-3.5" />
                  Courses
                </span>
              </Link>
              
              <Link
                href="/admin/users"
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium ${
                  isActive('/admin/users')
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center">
                  <FiUsers className="mr-1 h-3.5 w-3.5" />
                  Users
                </span>
              </Link>
              
              <Link
                href="/admin/announcements"
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium ${
                  isActive('/admin/announcements')
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center">
                  <FiBell className="mr-1 h-3.5 w-3.5" />
                  Announcements
                </span>
              </Link>
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Dark mode toggle */}
            <button
              type="button"
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <FiSun className="h-4 w-4" />
              ) : (
                <FiMoon className="h-4 w-4" />
              )}
            </button>
            
            {/* Logout */}
            <button
              type="button"
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
              onClick={handleLogout}
            >
              <FiLogOut className="h-4 w-4" />
            </button>
            
            {/* User menu */}
            {user && (
              <div className="relative flex items-center">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="ml-2 hidden md:block">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role === 'admin' ? 'Admin' : user.role}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden bg-white dark:bg-gray-800`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/admin/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/admin/dashboard')
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex items-center">
              <FiHome className="mr-2 h-5 w-5" />
              Dashboard
            </span>
          </Link>
          
          <Link
            href="/admin/courses"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/admin/courses')
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex items-center">
              <FiBook className="mr-2 h-5 w-5" />
              Courses
            </span>
          </Link>
          
          <Link
            href="/admin/users"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/admin/users')
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex items-center">
              <FiUsers className="mr-2 h-5 w-5" />
              Users
            </span>
          </Link>
          
          <Link
            href="/admin/announcements"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/admin/announcements')
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex items-center">
              <FiBell className="mr-2 h-5 w-5" />
              Announcements
            </span>
          </Link>
          
          <button
            className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleLogout}
          >
            <span className="flex items-center">
              <FiLogOut className="mr-2 h-5 w-5" />
              Log out
            </span>
          </button>
        </div>
      </div>
      
      {/* Padding for fixed navbar */}
      <div className="h-14"></div>
    </nav>
  );
} 