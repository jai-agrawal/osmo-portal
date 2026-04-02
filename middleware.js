import { NextResponse } from 'next/server';

export function middleware(request) {
  const { cookies } = request;
  const TOKEN_NAME = process.env.NEXT_PUBLIC_AUTH_TOKEN_NAME || '_osmo_token';
  const USER_ID_NAME = process.env.NEXT_PUBLIC_USER_ID || '_osmo_user_id';

  const token = cookies.get(TOKEN_NAME)?.value;
  const userId = cookies.get(USER_ID_NAME)?.value;

  const url = request.nextUrl.clone();

  if (url.pathname === '/') {
    if (token && userId) {
      return NextResponse.redirect(new URL('/explore-jobs', request.url));
    } else {
      // Guests land on explore jobs
      return NextResponse.redirect(new URL('/explore-jobs', request.url));
    }
  }

  if (url.pathname === '/sign-in' && token && userId) {
    return NextResponse.redirect(new URL('/explore-jobs', request.url));
  }

  if (!token || !userId) {
    // Allow guests to access job listing and job details, but block apply and protected areas
    const isExploreJobs = url.pathname.startsWith('/explore-jobs') && !url.pathname.endsWith('/apply');

    const isProtected = ['/application-success', '/account', '/status', '/profile'].some(path => url.pathname.startsWith(path));
    const isApply = /\/explore-jobs\/.+\/apply$/.test(url.pathname);

    if (isProtected || isApply) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Allow guest access for explore jobs and job details
    if (isExploreJobs) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/explore-jobs/:path*', '/application-success', '/account', '/status', '/profile', '/sign-in'],
};
