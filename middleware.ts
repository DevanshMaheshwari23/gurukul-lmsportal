import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the request
  const path = request.nextUrl.pathname;
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Function to create URL with correct basePath
  const createUrl = (pathname: string): URL => {
    const url = new URL(pathname, request.url);
    return url;
  };
  
  // Protect admin routes
  if (path.startsWith('/admin') || path.startsWith('/(admin)')) {
    // Check if user is authenticated and is an admin
    if (!token) {
      return NextResponse.redirect(createUrl('/login'));
    }
    
    // For API routes, allow the request to be handled by the route handler
    // which will validate the token role in more detail
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }
  }
  
  // Protect student routes
  if (path.startsWith('/student') || path.startsWith('/(student)')) {
    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(createUrl('/login'));
    }
  }
  
  // Protect API routes
  if (path.startsWith('/api/')) {
    // Some API routes don't require authentication (e.g., login, register)
    const publicRoutes = [
      '/api/auth/login', 
      '/api/auth/register', 
      '/api/courses/public'
    ];
    
    // If the route is not public and there's no token, return 401
    if (!publicRoutes.some(route => path.startsWith(route)) && !token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  return NextResponse.next();
}

// Add debugging information
export const config = {
  // Specify which paths this middleware will run on
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|public|.*\\.(.*)$).*)',
    '/api/:path*',
  ],
}; 