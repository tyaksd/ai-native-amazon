import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkAuth, isProtectedRoute } from "@/lib/auth-middleware";

export default clerkMiddleware((auth, request) => {
  // Check admin authentication for protected routes
  const authResult = checkAuth(request);
  
  if (!authResult.isAuthenticated) {
    return authResult.response;
  }
  
  // If everything is fine, continue with the request
  return NextResponse.next();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
