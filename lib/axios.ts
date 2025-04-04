import axios from 'axios';

// Determine base path based on environment
const basePath = typeof window !== 'undefined' 
  ? window.location.pathname.startsWith('/gurukul') ? '/gurukul' : ''
  : '/gurukul';

// Create axios instance with baseURL
const axiosInstance = axios.create({
  baseURL: basePath,
  timeout: 15000,
});

// Add a request interceptor to handle token authentication
axiosInstance.interceptors.request.use((config) => {
  // Get token from localStorage if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      // Use window.location to ensure proper baseURL handling for redirect
      window.location.href = `${basePath}/login`;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 