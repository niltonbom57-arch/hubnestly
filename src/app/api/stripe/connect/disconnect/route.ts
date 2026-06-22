/**
 * DELETE /api/stripe/connect/disconnect
 * Remove a conta Stripe Connect do tenant.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getStripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'

export async function DELETE() {
  try {
    const user = await requireAuth()

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { stripeAccountId: true },
    })

    if (!tenant?.stripeAccountId) {
      return NextResponse.json({ error: 'Nenhuma conta conectada' }, { status: 400 })
    }

    // Desconecta no Stripe
    const stripe = getStripe()
    await stripe.oauth.deauthorize({
      client_id: process.env.STRIPE_CLIENT_ID ?? '',
      stripe_user_id: tenant.stripeAccountId,
    })

    // Remove do banco
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { stripeAccountId: null, stripeAccountStatus: null },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
