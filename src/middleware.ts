import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // This creates a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });
  const path = req.nextUrl.pathname;

  console.log('=== Middleware Start ===', path);

  try {
    // Allow auth callback to process without interference
    if (path === '/auth/callback') {
      console.log('Middleware: Allowing auth callback to process');
      return res;
    }

    // First, try to refresh the session to make sure we have the latest auth state
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError && refreshError.message !== 'Auth session missing!') {
      console.log('Middleware refresh error (non-critical):', refreshError.message);
    }

    // Now get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('Middleware Debug:', {
      path,
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionError: sessionError?.message,
      userId: session?.user?.id || 'none',
      refreshWorked: !!refreshedSession
    });

    const isLoggedIn = !!session?.user;

    console.log('Middleware - Path:', path, 'IsLoggedIn:', isLoggedIn);

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/services/new'];
    const isProtectedRoute = protectedRoutes.some(route => 
      path === route || path.startsWith(route + '/')
    );

    // If trying to access protected route without auth
    if (isProtectedRoute && !isLoggedIn) {
      console.log('Middleware: Redirecting to signin - not authenticated for', path);
      const signinUrl = new URL("/auth/signin", req.url);
      signinUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(signinUrl);
    }

    // If authenticated user tries to access signin page
    if (path === '/auth/signin' && isLoggedIn) {
      console.log('Middleware: Redirecting authenticated user to home');
      return NextResponse.redirect(new URL("/", req.url));
    }

    // For protected routes with valid auth, just continue
    if (isProtectedRoute && isLoggedIn) {
      console.log('Middleware: User authenticated, PROCEEDING to:', path);
    }

    console.log('=== Middleware End - Allowing access ===');
    
    // IMPORTANT: Return the response that includes any cookie changes
    return res;
    
  } catch (error) {
    console.error('Middleware caught error:', error);
    
    // On error for protected routes, redirect to signin
    const protectedRoutes = ['/dashboard', '/profile', '/services/new'];
    const isProtectedRoute = protectedRoutes.some(route => 
      path === route || path.startsWith(route + '/')
    );
    
    if (isProtectedRoute) {
      console.log('Middleware: Error occurred, redirecting to signin');
      const signinUrl = new URL("/auth/signin", req.url);
      signinUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(signinUrl);
    }
    
    return res;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*", 
    "/services/new",
    "/auth/signin",
    "/auth/callback"
  ],
};