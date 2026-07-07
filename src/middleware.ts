import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl

    // Admin-only routes
    const adminRoutes = ['/dashboard/reports', '/dashboard/services', '/dashboard/settings']
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Proteger rotas /dashboard/*
        if (pathname.startsWith('/dashboard')) {
          return !!token && (token.role === 'admin' || token.role === 'professional')
        }
        // Qualquer usuário logado pode ver /my-appointments
        if (pathname.startsWith('/my-appointments')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/my-appointments/:path*'],
}
