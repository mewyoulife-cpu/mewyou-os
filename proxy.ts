import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, isValidToken } from '@/lib/auth'

// Gatekeeper: every request must carry a valid session cookie, except the login
// page and the auth API. Runs on the Node.js runtime (Next 16 default).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authed = isValidToken(request.cookies.get(AUTH_COOKIE)?.value)

  // Always let the login page, auth endpoints, and public stats through.
  if (pathname === '/login' || pathname.startsWith('/api/auth') || pathname.startsWith('/api/public')) {
    // Already signed in? Skip the login page.
    if (pathname === '/login' && authed) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!authed) {
    const url = new URL('/login', request.url)
    if (pathname && pathname !== '/') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|ttf)$).*)',
  ],
}
