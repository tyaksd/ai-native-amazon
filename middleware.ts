import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, isProtectedRoute, isProduction } from '@/lib/auth-middleware'

export function middleware(request: NextRequest) {
  // Only apply authentication in production
  if (!isProduction()) {
    return NextResponse.next()
  }

  // Check if the route is protected
  if (!isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Check authentication
  const authResult = checkAuth(request)
  
  if (!authResult.isAuthenticated) {
    return authResult.response!
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/oiu/:path*',
    '/lkj/:path*',
    '/sora/:path*', // sora2 re-enabled
    '/sns/:path*', // sns re-enabled
  ]
}
