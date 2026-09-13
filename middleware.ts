import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'consistent-app-super-secret-jwt-key-2026'
)

const COOKIE_NAME = 'consistent_session'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login')
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')

  if (isPublicAsset) {
    return NextResponse.next()
  }

  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  // Redirect unauthenticated users to /login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from /login to homepage /
  if (isAuthenticated && isAuthPage) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
