/**
 * Navigation utilities to handle basePath for proper routing
 */

// Get the base path for the application
export function getBasePath(): string {
  // In browser context, detect from the URL
  if (typeof window !== 'undefined') {
    return window.location.pathname.startsWith('/gurukul') ? '/gurukul' : '';
  }
  
  // In server context, use environment variable or default to '/gurukul' for production
  return process.env.NODE_ENV === 'production' ? '/gurukul' : '';
}

// Get application path with basePath prefix
export function getAppPath(path: string): string {
  const basePath = getBasePath();
  
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Concatenate basePath with the path
  return `${basePath}${normalizedPath}`;
}

// Navigate to a route with proper basePath handling
export function navigateTo(path: string, useRouter?: any): void {
  const fullPath = getAppPath(path);
  
  // If router is provided, use it for client-side navigation
  if (useRouter) {
    useRouter.push(fullPath);
    return;
  }
  
  // Fallback to window.location if router is not available
  if (typeof window !== 'undefined') {
    window.location.href = fullPath;
  }
}

// Format API path with basePath
export function getApiPath(endpoint: string): string {
  const basePath = getBasePath();
  
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construct API path with basePath
  return `${basePath}${normalizedEndpoint}`;
} 