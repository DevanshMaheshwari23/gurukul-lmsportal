import axios from 'axios';

// Create axios instance with a longer timeout
const axiosInstance = axios.create({
  timeout: 30000, // Increase timeout to 30 seconds
});

// Add a request interceptor that dynamically handles paths
axiosInstance.interceptors.request.use((config) => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Check if the URL is already absolute
    if (config.url && !config.url.startsWith('http')) {
      // For API requests - always use direct URLs without the basePath
      if (config.url.startsWith('/api/')) {
        // If we're at the /gurukul path but making API requests, remove the /gurukul from URL
        // This is critical - we need to make API requests directly to /api/* not /gurukul/api/*
        const urlParts = window.location.origin.split('/');
        const baseUrl = urlParts[0] + '//' + urlParts[2]; // protocol + hostname
        config.url = `${baseUrl}${config.url}`;
      } else {
        // For non-API requests, add basePath if needed
        const basePath = window.location.pathname.startsWith('/gurukul') ? '/gurukul' : '';
        config.url = `${basePath}${config.url}`;
      }
    }
    
    // Add Authorization header if token exists
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Log API requests in development to help debug
  if (process.env.NODE_ENV !== 'production' && config.url?.includes('/api/')) {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (process.env.NODE_ENV !== 'production' && response.config.url?.includes('/api/')) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Create a standardized error message
    const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'An unknown error occurred';
    
    // Log errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: errorMessage
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear token
      localStorage.removeItem('token');
      
      // Redirect to login with correct path
      const basePath = window.location.pathname.startsWith('/gurukul') ? '/gurukul' : '';
      window.location.href = `${basePath}/login`;
    }
    
    // Convert the error to a standard format before rejecting
    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      original: error
    });
  }
);

export default axiosInstance; 