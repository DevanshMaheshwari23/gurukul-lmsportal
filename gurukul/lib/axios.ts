import axios from 'axios';

// Create axios instance without baseURL initially
const axiosInstance = axios.create({
  timeout: 15000,
});

// Add a request interceptor that dynamically handles paths
axiosInstance.interceptors.request.use((config) => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Get the URL hostname
    const hostname = window.location.hostname;
    
    // Check if the URL is already absolute
    if (config.url && !config.url.startsWith('http')) {
      // For API requests
      if (config.url.startsWith('/api/')) {
        // Vercel requires API requests without the basePath prefix
        config.url = config.url;
      } else {
        // For non-API requests, add basePath
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
  
  return config;
});

// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear token
      localStorage.removeItem('token');
      
      // Redirect to login with correct path
      const basePath = window.location.pathname.startsWith('/gurukul') ? '/gurukul' : '';
      window.location.href = `${basePath}/login`;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 