import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isPublicPage =
    isLoginPage ||
    req.nextUrl.pathname.startsWith('/queue') ||
    req.nextUrl.pathname.startsWith('/book')

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isLoggedIn && isLoginPage) {
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.nextUrl))
    }
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  // Protect /admin: non-SUPER_ADMIN redirected to /dashboard
  if (isLoggedIn && isAdminPage && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
