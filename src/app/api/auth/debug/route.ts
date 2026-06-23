import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const session = await getServerSession(authOptions)
  const hdrs = Object.fromEntries((await headers()).entries())

  return NextResponse.json({
    session,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV:     process.env.NODE_ENV,
    },
    cookies: hdrs['cookie']?.split(';').map(c => c.trim().split('=')[0]) ?? [],
  })
}
