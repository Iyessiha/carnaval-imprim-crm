import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer sans vérification
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Chercher un cookie de session Supabase (format: sb-PROJECTREF-auth-token)
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => 
    (c.name.startsWith('sb-') && c.name.includes('-auth-token')) ||
    c.name === 'supabase-auth-token'
  )

  // Si pas de session → login
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
