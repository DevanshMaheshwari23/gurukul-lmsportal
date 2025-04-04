import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  // If no token and trying to access dashboard, redirect to login
  if (!token && request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For simplicity, in a real app you would validate token and extract role
  // This example assumes you store role information in a separate cookie
  const userRole = request.cookies.get('user_role')?.value || 'student';
  
  // Redirect to the correct dashboard based on role
  if (request.nextUrl.pathname === '/dashboard') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configure the paths that the middleware should run on
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}; 