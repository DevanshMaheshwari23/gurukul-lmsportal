'use client';

import React, { useState, useEffect } from 'react';
import Link from '@/components/Link';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { setCookie } from 'cookies-next';
import { navigateTo } from '@/lib/utils/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');

    // Basic validation
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      // Using direct API path without the basePath prefix
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });
      
      // Validate response data
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Save token to local storage
      localStorage.setItem('token', response.data.token);
      
      // Save user role for routing decisions on the client side
      localStorage.setItem('userRole', response.data.user.role);
      
      // Save user role in cookie for middleware
      setCookie('token', response.data.token, { maxAge: 60 * 60 * 24 * 7 }); // 7 days
      setCookie('user_role', response.data.user.role, { maxAge: 60 * 60 * 24 * 7 }); // 7 days

      // Set success message
      setSuccess('Login successful! Redirecting to dashboard...');

      // Clear form
      setEmail('');
      setPassword('');
      
      // Redirect based on user role
      const userRole = response.data.user.role;
      
      // Use setTimeout to allow the success message to be displayed
      setTimeout(() => {
        if (userRole === 'admin') {
          navigateTo('/admin/dashboard', router);
        } else {
          navigateTo('/student/dashboard', router);
        }
      }, 1000);
      
    } catch (error: any) {
      // Handle standardized error format from axios interceptor
      if (error && typeof error === 'object') {
        if (error.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (error.status === 504) {
          setError('The server took too long to respond. Please try again.');
        } else if (error.message) {
          setError(error.message);
        } else {
          setError('Authentication failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Register now
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 