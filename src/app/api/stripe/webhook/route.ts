import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'
import { addMinutes } from 'date-fns'
import { SCHEDULING } from '@/lib/pricing/constants'
import { hasConflict } from '@/lib/scheduling/check-conflict'
import { findTimeBlocksInRange } from '@/lib/repositories/timeblock-repository'
import { notifyAdminBookingConfirmed } from '@/lib/notifications/notify-admin'

export const runtime = 'nodejs'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Assinatura ausente', { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch {
    return new Response('Assinatura inválida', { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 })
  }

  const session = event.data.object
  const bookingId = session.metadata?.bookingId

  if (!bookingId) {
    return new Response('bookingId ausente nos metadados', { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      scheduledAt: true,
      estimatedDuration: true,
      teamId: true,
      stripeSessionId: true,
      price: true,
      user: { select: { name: true } },
      property: { select: { nickname: true, address: true, city: true } },
    },
  })

  if (!booking) return new Response('Booking não encontrado', { status: 404 })

  // C3: Stripe Connect account verification
  if (event.account) {
    const tenantStripe = await prisma.tenant.findUnique({
      where: { id: booking.tenantId },
      select: { stripeAccountId: true },
    })
    if (tenantStripe?.stripeAccountId && event.account !== tenantStripe.stripeAccountId) {
      return new Response('Connect account mismatch', { status: 403 })
    }
  }

  // Idempotência — já processado
  if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
    return new Response('OK', { status: 200 })
  }

  const bookingEnd = addMinutes(booking.scheduledAt, booking.estimatedDuration)
  const blockEnd = addMinutes(bookingEnd, SCHEDULING.TRAVEL_BLOCK_MINUTES)

  // Re-verifica conflito (proteção contra condição de corrida)
  const existingBlocks = await findTimeBlocksInRange(booking.scheduledAt, blockEnd, booking.tenantId)
  const teamId = booking.teamId

  if (teamId) {
    const conflict = hasConflict(
      { startAt: booking.scheduledAt, endAt: blockEnd },
      existingBlocks,
      teamId,
    )

    if (conflict) {
      // Estorna pagamento e cancela booking
      await stripe.refunds.create({ payment_intent: session.payment_intent as string })
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      })
      return new Response('Conflito detectado — reembolso iniciado', { status: 200 })
    }
  }

  // Confirma booking e cria TimeBlocks atomicamente
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        stripePaymentIntentId: session.payment_intent as string,
      },
    }),
    prisma.timeBlock.create({
      data: {
        tenantId: booking.tenantId,
        startAt: booking.scheduledAt,
        endAt: bookingEnd,
        type: 'BOOKING',
        bookingId,
        teamId,
      },
    }),
    prisma.timeBlock.create({
      data: {
        tenantId: booking.tenantId,
        startAt: bookingEnd,
        endAt: blockEnd,
        type: 'TRAVEL',
        bookingId,
        teamId,
      },
    }),
  ])

  // Notifica admins por email + SMS + salva no banco (não bloqueia resposta ao Stripe)
  notifyAdminBookingConfirmed({
    tenantId:         booking.tenantId,
    bookingId:        booking.id,
    clientName:       booking.user?.name ?? 'Cliente',
    propertyNickname: booking.property?.nickname ?? 'Imóvel',
    propertyAddress:  booking.property ? `${booking.property.address}, ${booking.property.city}` : '',
    scheduledAt:      booking.scheduledAt,
    totalPrice:       Number(booking.price),
  }).catch((e: unknown) => console.error('[Notify] Falha ao notificar admin:', e))

  return new Response('OK', { status: 200 })
}
