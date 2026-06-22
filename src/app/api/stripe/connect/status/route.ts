/**
 * GET /api/stripe/connect/status
 * Retorna o status da conta Stripe Connect do tenant autenticado.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getStripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const user = await requireAuth()

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        stripeAccountId:     true,
        stripeAccountStatus: true,
        platformFeePercent:  true,
      },
    })

    if (!tenant?.stripeAccountId) {
      return NextResponse.json({ connected: false })
    }

    // Revalida status em tempo real no Stripe
    try {
      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(tenant.stripeAccountId)
      const liveStatus = account.charges_enabled ? 'active'
        : account.details_submitted              ? 'pending'
        : 'restricted'

      // Atualiza se mudou
      if (liveStatus !== tenant.stripeAccountStatus) {
        await prisma.tenant.update({
          where: { id: user.tenantId },
          data: { stripeAccountStatus: liveStatus },
        })
      }

      return NextResponse.json({
        connected:          true,
        accountId:          tenant.stripeAccountId,
        status:             liveStatus,
        chargesEnabled:     account.charges_enabled,
        detailsSubmitted:   account.details_submitted,
        platformFeePercent: Number(tenant.platformFeePercent),
      })
    } catch {
      // Stripe inacessível — retorna dados em cache
      return NextResponse.json({
        connected:          true,
        accountId:          tenant.stripeAccountId,
        status:             tenant.stripeAccountStatus ?? 'unknown',
        platformFeePercent: Number(tenant.platformFeePercent),
      })
    }
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}
