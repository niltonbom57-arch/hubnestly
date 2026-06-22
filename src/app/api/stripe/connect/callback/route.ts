/**
 * GET /api/stripe/connect/callback
 * Stripe redireciona aqui após o OAuth. Salva o stripeAccountId no tenant.
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getStripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''
  const settingsUrl = (slug: string) => `${appUrl}/t/${slug}/admin/settings`

  // Usuário deve estar autenticado
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { tenantId?: string; tenantSlug?: string; role?: string } | undefined
  if (!session || sessionUser?.role !== 'ADMIN') {
    return NextResponse.redirect(`${appUrl}/auth/login`)
  }

  if (error) {
    return NextResponse.redirect(
      `${settingsUrl(sessionUser?.tenantSlug ?? '')}?stripe_error=${encodeURIComponent(searchParams.get('error_description') ?? error)}`,
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl(sessionUser?.tenantSlug ?? '')}?stripe_error=missing_params`)
  }

  // Verifica HMAC do state
  let tenantId: string
  try {
    const outer = JSON.parse(Buffer.from(state, 'base64url').toString()) as { payload: string; hmac: string }
    const expectedHmac = createHmac('sha256', process.env.NEXTAUTH_SECRET ?? 'dev')
      .update(outer.payload).digest('hex')
    if (expectedHmac !== outer.hmac) throw new Error('invalid hmac')
    const inner = JSON.parse(outer.payload) as { tenantId: string }
    tenantId = inner.tenantId
  } catch {
    return NextResponse.redirect(`${settingsUrl(sessionUser?.tenantSlug ?? '')}?stripe_error=invalid_state`)
  }

  // Verifica que o usuário autenticado pertence ao tenantId do state
  if (sessionUser?.tenantId !== tenantId) {
    return NextResponse.redirect(`${settingsUrl(sessionUser?.tenantSlug ?? '')}?stripe_error=unauthorized`)
  }

  // Verifica que o tenant não tem conta Stripe já conectada (evita sobrescrita)
  const existingTenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { stripeAccountId: true, slug: true },
  })
  const tenantSlug = existingTenant?.slug ?? sessionUser?.tenantSlug ?? ''

  if (existingTenant?.stripeAccountId) {
    return NextResponse.redirect(`${settingsUrl(tenantSlug)}?stripe_error=already_connected`)
  }

  try {
    const stripe = getStripe()
    const response = await stripe.oauth.token({ grant_type: 'authorization_code', code })
    const stripeAccountId = response.stripe_user_id
    if (!stripeAccountId) throw new Error('stripe_user_id ausente na resposta')

    const account = await stripe.accounts.retrieve(stripeAccountId)
    const accountStatus = account.charges_enabled ? 'active' : account.details_submitted ? 'pending' : 'restricted'

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeAccountId, stripeAccountStatus: accountStatus },
    })

    return NextResponse.redirect(`${settingsUrl(tenantSlug)}?stripe_connected=1`)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.redirect(`${settingsUrl(tenantSlug)}?stripe_error=${encodeURIComponent(message)}`)
  }
}
