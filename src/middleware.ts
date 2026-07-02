import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pages publiques — jamais de redirection
  if (
    pathname === '/'           ||   // landing page
    pathname === '/login'      ||   // page de connexion
    pathname.startsWith('/api/') || // API routes
    pathname.startsWith('/_next/') ||
    pathname.includes('.')         // fichiers statiques (.ico, .png…)
  ) {
    return NextResponse.next()
  }

  // Pour toutes les autres pages (dashboard, clients, etc.)
  // vérifier le cookie de session Supabase
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c =>
    (c.name.startsWith('sb-') && c.name.includes('-auth-token')) ||
    c.name === 'supabase-auth-token'
  )

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
