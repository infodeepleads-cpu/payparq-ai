import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

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

  // If no user and trying to access protected routes, redirect to login
  if (!user && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/officer') || req.nextUrl.pathname.startsWith('/officers') || req.nextUrl.pathname.startsWith('/managers') || req.nextUrl.pathname.startsWith('/driver') || req.nextUrl.pathname.startsWith('/members'))) {
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/officer/:path*', '/officers/:path*', '/managers/:path*', '/driver/:path*', '/members/:path*'],
};
