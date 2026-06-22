/**
 * GET /api/stripe/connect/authorize
 * Redireciona o admin do tenant para o OAuth do Stripe Connect.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createHmac, randomUUID } from 'crypto'
import { requireAuth } from '@/lib/auth/require-auth'

export async function GET() {
  try {
    const user = await requireAuth()

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientId = process.env.STRIPE_CLIENT_ID
    if (!clientId || clientId === 'ca_placeholder') {
      return NextResponse.json(
        { error: 'STRIPE_CLIENT_ID não configurado. Configure no Stripe Dashboard > Connect > Settings.' },
        { status: 500 },
      )
    }

    const redirectUri = encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL}/api/stripe/connect/callback`,
    )

    const nonce = randomUUID()
    const payload = JSON.stringify({ tenantId: user.tenantId, nonce })
    const hmac = createHmac('sha256', process.env.NEXTAUTH_SECRET ?? 'dev')
      .update(payload).digest('hex')
    const state = Buffer.from(JSON.stringify({ payload, hmac })).toString('base64url')

    const oauthUrl =
      `https://connect.stripe.com/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&scope=read_write` +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}` +
      `&suggested_capabilities[]=transfers`

    return NextResponse.redirect(oauthUrl)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}
