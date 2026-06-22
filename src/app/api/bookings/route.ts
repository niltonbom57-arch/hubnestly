export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createBookingSchema } from '@/lib/validation/schemas/booking'
import { findBookingsByUser } from '@/lib/repositories/booking-repository'
import { findPropertyById } from '@/lib/repositories/property-repository'
import { findAddOnsByIds } from '@/lib/repositories/addon-repository'
import { calculatePrice } from '@/lib/pricing/calculate-price'
import { calculateDuration } from '@/lib/pricing/calculate-duration'
import { createCheckoutSession } from '@/lib/stripe/create-checkout'
import { prisma } from '@/lib/db/prisma'
import { ok, created, err, unauthorized, serverError, notFound } from '@/lib/api/response'

export async function GET() {
  try {
    const user = await requireAuth()
    const bookings = await findBookingsByUser(user.id, user.tenantId)
    return ok(bookings)
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body: unknown = await req.json()
    const parsed = createBookingSchema.safeParse(body)

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { propertyId, scheduledAt, teamId, notes, addOnIds } = parsed.data

    const property = await findPropertyById(propertyId, user.id)
    if (!property) return notFound('Imóvel')

    if (!user.tenantId) return err('Tenant inválido', 400)

    // Busca add-ons selecionados — verifica que pertencem ao tenant do usuário
    const selectedAddOns = addOnIds.length > 0 ? await findAddOnsByIds(addOnIds, user.tenantId) : []

    // Valida que o teamId pertence ao tenant (se fornecido)
    if (teamId) {
      const teamBelongs = await prisma.team.findFirst({ where: { id: teamId, tenantId: user.tenantId, isActive: true } })
      if (!teamBelongs) return err('Time inválido', 400)
    }

    // Busca conta Stripe Connect + taxa da plataforma do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { stripeAccountId: true, platformFeePercent: true },
    })

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
      select: { useHoldCapture: true },
    })

    // Recalcula preço e duração no servidor
    const { total: basePrice } = calculatePrice(property)
    const baseDuration = calculateDuration(property)

    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
    const addOnDuration = selectedAddOns.reduce((sum, a) => sum + a.durationMinutes, 0)

    const totalPrice = basePrice + addOnTotal
    const totalDuration = baseDuration + addOnDuration
    const scheduledDate = new Date(scheduledAt)

    // Cria booking e add-ons numa transação
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          propertyId,
          teamId: teamId ?? null,
          scheduledAt: scheduledDate,
          estimatedDuration: totalDuration,
          price: totalPrice,
          status: 'PENDING',
          notes: notes ?? null,
        },
        select: { id: true, price: true },
      })

      if (selectedAddOns.length > 0) {
        await tx.bookingAddOn.createMany({
          data: selectedAddOns.map((a) => ({
            bookingId: b.id,
            addOnId: a.id,
            price: a.price,
          })),
        })
      }

      return b
    })

    const checkoutUrl = await createCheckoutSession({
      bookingId: booking.id,
      price: totalPrice,
      propertyNickname: property.nickname,
      userEmail: user.email ?? '',
      scheduledAt: scheduledDate,
      stripeAccountId:    tenant?.stripeAccountId  ?? undefined,
      platformFeePercent: tenant?.platformFeePercent
        ? Number(tenant.platformFeePercent)
        : undefined,
      useHoldCapture: tenantSettings?.useHoldCapture ?? false,
    })

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: checkoutUrl.sessionId },
    })

    return created({ bookingId: booking.id, checkoutUrl: checkoutUrl.url })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}
