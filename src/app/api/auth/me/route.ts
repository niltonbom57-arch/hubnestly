import { auth } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  const user = session.user as {
    id?: string
    role?: string
    tenantSlug?: string
    isPlatformAdmin?: boolean
  }
  return NextResponse.json({
    authenticated:   true,
    isPlatformAdmin: user.isPlatformAdmin ?? false,
    role:            user.role ?? 'CLIENT',
    tenantSlug:      user.tenantSlug ?? '',
  })
}
