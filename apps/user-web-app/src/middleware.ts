import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function middleware(req: NextRequest) {
  // Handle CORS preflight for API routes
  if (req.nextUrl.pathname.startsWith('/api/') && req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const res = NextResponse.next();

  // Add CORS headers to all API responses
  if (req.nextUrl.pathname.startsWith('/api/')) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies.getAll()).map(([name, cookie]) => ({
            name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/officer') || req.nextUrl.pathname.startsWith('/officers') || req.nextUrl.pathname.startsWith('/managers') || req.nextUrl.pathname.startsWith('/driver'))) {
    const redirectUrl = new URL('/members', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/dashboard', '/officer/:path*', '/officers/:path*', '/managers/:path*', '/driver/:path*', '/members/:path*'],
};
