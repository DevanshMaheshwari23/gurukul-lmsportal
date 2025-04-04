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
  if (path.startsWith('/gurukul/admin') || path.startsWith('/gurukul/(admin)')) {
    // Check if user is authenticated and is an admin
    if (!token) {
      return NextResponse.redirect(createUrl('/gurukul/login'));
    }
    
    // For API routes, allow the request to be handled by the route handler
    // which will validate the token role in more detail
    if (path.startsWith('/gurukul/api/')) {
      return NextResponse.next();
    }
  }
  
  // Protect student routes
  if (path.startsWith('/gurukul/student') || path.startsWith('/gurukul/(student)')) {
    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(createUrl('/gurukul/login'));
    }
  }
  
  // Protect API routes
  if (path.startsWith('/gurukul/api/')) {
    // Some API routes don't require authentication (e.g., login, register)
    const publicRoutes = [
      '/gurukul/api/auth/login', 
      '/gurukul/api/auth/register', 
      '/gurukul/api/courses/public'
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

export const config = {
  // Specify which paths this middleware will run on
  matcher: [
    '/gurukul/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/gurukul/api/:path*',
    '/gurukul/(admin)/:path*',
    '/gurukul/(student)/:path*',
  ],
}; 