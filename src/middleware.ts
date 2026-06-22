import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/onboarding',
  '/auth/login',
  '/auth/register',
  '/api/onboarding',
  '/api/auth',
  '/api/stripe/webhook',
  '/api/stripe/billing-webhook',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    const token = (req as NextRequest & { nextauth?: { token?: { role?: string } } }).nextauth?.token

    type Token = { role?: string; tenantSlug?: string; isPlatformAdmin?: boolean }
    const t = token as Token | undefined

    // ── Redireciona automaticamente conforme perfil ────────────────────────
    // Admin de empresa tentando acessar /dashboard → redireciona para o painel da empresa
    if (pathname === '/dashboard' && t?.role === 'ADMIN' && t?.tenantSlug && !t?.isPlatformAdmin) {
      return NextResponse.redirect(new URL(`/t/${t.tenantSlug}/admin`, req.url))
    }

    // Admin da plataforma tentando acessar /dashboard → redireciona para /admin
    if (pathname === '/dashboard' && t?.isPlatformAdmin) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // Super-admin: exige isPlatformAdmin (guardado no token)
    if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/super-admin')) {
      if (!token || !t?.isPlatformAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.next()
    }

    // Rotas tenant /t/[slug]/admin → exige role ADMIN do próprio tenant
    const adminMatch = pathname.match(/^\/t\/([^/]+)\/admin/)
    if (adminMatch) {
      if (t?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      // Garante que o admin só acessa o tenant dele
      const slugInUrl = adminMatch[1]
      if (t?.tenantSlug && t.tenantSlug !== slugInUrl && !t?.isPlatformAdmin) {
        return NextResponse.redirect(new URL(`/t/${t.tenantSlug}/admin`, req.url))
      }
    }

    // Rota /admin (plataforma) → somente platform admin
    if (pathname.startsWith('/admin') && !t?.isPlatformAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Propaga o slug do tenant nos headers para os route handlers
    const slugMatch = pathname.match(/^\/t\/([^/]+)/)
    if (slugMatch?.[1]) {
      const response = NextResponse.next()
      response.headers.set('x-tenant-slug', slugMatch[1])
      return response
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl
        if (isPublicPath(pathname)) return true
        // Qualquer rota sob /t/[slug]/dashboard ou /admin exige login
        if (pathname.match(/^\/t\/[^/]+\/(dashboard|admin|booking|properties|profile)/)) {
          return !!token
        }
        // Legado (rotas antigas sem /t/slug)
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
          return !!token
        }
        return true
      },
    },
  },
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
