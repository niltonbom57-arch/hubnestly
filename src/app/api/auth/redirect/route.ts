import { auth } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/login', process.env.NEXTAUTH_URL ?? 'https://www.hubnestly.com'))
  }

  const user = session.user as {
    role?: string
    tenantSlug?: string
    isPlatformAdmin?: boolean
  }

  const base = process.env.NEXTAUTH_URL ?? 'https://www.hubnestly.com'

  if (user.isPlatformAdmin) {
    return NextResponse.redirect(new URL('/master', base))
  }

  if (user.role === 'ADMIN' && user.tenantSlug) {
    return NextResponse.redirect(new URL(`/t/${user.tenantSlug}/admin`, base))
  }

  return NextResponse.redirect(new URL('/dashboard', base))
}
