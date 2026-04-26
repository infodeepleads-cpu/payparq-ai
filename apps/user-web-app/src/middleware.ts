import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected routes, redirect to login
  if (!session && (req.nextUrl.pathname.startsWith('/officers') || req.nextUrl.pathname.startsWith('/managers') || req.nextUrl.pathname.startsWith('/driver'))) {
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Route based on role
    if (req.nextUrl.pathname === '/dashboard') {
      const role = profile?.role;
      if (role === 'officer') {
        return NextResponse.redirect(new URL('/officers/dashboard', req.url));
      } else if (role === 'city_manager') {
        return NextResponse.redirect(new URL('/managers/dashboard', req.url));
      } else if (role === 'driver') {
        return NextResponse.redirect(new URL('/driver/dashboard', req.url));
      }
    }

    // Prevent unauthorized access
    if (req.nextUrl.pathname.startsWith('/officers') && profile?.role !== 'officer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/managers') && profile?.role !== 'city_manager') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/driver') && profile?.role !== 'driver' && profile?.role !== 'officer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/officers') && profile?.role !== 'officer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/resources') && !['city_manager', 'superadmin'].includes(profile?.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/officers/:path*', '/managers/:path*', '/driver/:path*', '/resources/:path*', '/admin/:path*', '/dashboard'],
};
