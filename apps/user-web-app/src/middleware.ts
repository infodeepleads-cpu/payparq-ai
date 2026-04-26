import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected routes, redirect to login
  if (!session && (req.nextUrl.pathname.startsWith('/officers') || req.nextUrl.pathname.startsWith('/managers') || req.nextUrl.pathname.startsWith('/driver') || req.nextUrl.pathname.startsWith('/members'))) {
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/officers/:path*', '/managers/:path*', '/driver/:path*', '/members/:path*'],
};
