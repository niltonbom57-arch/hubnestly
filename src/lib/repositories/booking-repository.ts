import { prisma } from '@/lib/db/prisma'
import { BookingStatus } from '@prisma/client'
import { getStripe } from '@/lib/stripe/client'

const bookingSelect = {
  id: true,
  userId: true,
  propertyId: true,
  teamId: true,
  scheduledAt: true,
  estimatedDuration: true,
  price: true,
  status: true,
  notes: true,
  stripeSessionId: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: {
      nickname: true,
      address: true,
      city: true,
    },
  },
  team: {
    select: { name: true, color: true },
  },
  bookingAddOns: {
    select: {
      price: true,
      addOn: {
        select: { id: true, name: true, icon: true, price: true },
      },
    },
  },
} as const

export async function findBookingsByUser(userId: string, tenantId?: string) {
  return prisma.booking.findMany({
    where: { userId, ...(tenantId ? { tenantId } : {}) },
    select: bookingSelect,
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function findBookingById(id: string, userId?: string, tenantId?: string) {
  return prisma.booking.findFirst({
    where: { id, ...(userId ? { userId } : {}), ...(tenantId ? { tenantId } : {}) },
    select: bookingSelect,
  })
}

export async function findBookingBySessionId(stripeSessionId: string) {
  return prisma.booking.findUnique({
    where: { stripeSessionId },
    select: { ...bookingSelect, stripePaymentIntentId: true },
  })
}

export async function findAllBookings(tenantId: string, filters?: {
  status?: BookingStatus
  from?: Date
  to?: Date
}) {
  return prisma.booking.findMany({
    where: {
      tenantId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.from || filters?.to
        ? {
            scheduledAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    select: {
      ...bookingSelect,
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })
}

export async function cancelBooking(id: string, tenantId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true, stripePaymentIntentId: true },
  })
  if (!booking) throw new Error('NOT_FOUND')

  // Delete associated TimeBlocks
  await prisma.timeBlock.deleteMany({ where: { bookingId: id } })

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    select: bookingSelect,
  })

  // Issue Stripe refund if payment was captured
  if (booking.stripePaymentIntentId && ['PAID', 'CONFIRMED'].includes(booking.status)) {
    try {
      const stripe = getStripe()
      await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId })
    } catch (e) {
      console.error('[cancelBooking] Stripe refund failed:', e)
      // Don't throw — cancellation already committed
    }
  }

  return updated
}

export async function rescheduleBooking(id: string, scheduledAt: Date, teamId: string, tenantId: string) {
  // Busca tenantId e duração antes de atualizar — valida posse do tenant
  const existing = await prisma.booking.findFirst({
    where: { id, tenantId },
    select: { tenantId: true, estimatedDuration: true },
  })
  if (!existing) throw new Error('NOT_FOUND')

  // Verifica conflito de horário para o time escolhido
  const endAt = new Date(scheduledAt.getTime() + existing.estimatedDuration * 60 * 1000)
  const conflict = await prisma.timeBlock.findFirst({
    where: {
      tenantId,
      teamId,
      bookingId: { not: id },
      startAt: { lt: endAt },
      endAt: { gt: scheduledAt },
    },
  })
  if (conflict) throw new Error('CONFLICT')

  // Remove TimeBlocks antigos associados a este booking
  await prisma.timeBlock.deleteMany({ where: { bookingId: id } })

  const updated = await prisma.booking.update({
    where: { id },
    data: { scheduledAt, teamId },
    select: bookingSelect,
  })

  // Recria TimeBlock do booking
  await prisma.timeBlock.create({
    data: {
      tenantId,
      startAt: scheduledAt,
      endAt,
      type: 'BOOKING',
      bookingId: id,
      teamId,
    },
  })

  // Recria TimeBlock de viagem (40 min após o fim)
  await prisma.timeBlock.create({
    data: {
      tenantId,
      startAt: endAt,
      endAt: new Date(endAt.getTime() + 40 * 60 * 1000),
      type: 'TRAVEL',
      bookingId: id,
      teamId,
    },
  })

  return updated
}
