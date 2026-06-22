export const dynamic = 'force-dynamic'

import { requirePlatformAdmin } from '@/lib/auth/require-auth'
import { findAllBookings } from '@/lib/repositories/booking-repository'
import { ok, forbidden, serverError } from '@/lib/api/response'
import { NextRequest } from 'next/server'
import { BookingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = req.nextUrl
    const tenantId = searchParams.get('tenantId') ?? undefined
    const status = searchParams.get('status') as BookingStatus | null

    // Platform admin pode ver todos os bookings de um tenant específico ou todos
    if (tenantId) {
      const bookings = await findAllBookings(tenantId, { status: status ?? undefined })
      return ok(bookings)
    }

    // Sem filtro de tenant — busca cross-tenant via Prisma direto (plataforma)
    const { prisma } = await import('@/lib/db/prisma')
    const bookings = await prisma.booking.findMany({
      where: { ...(status ? { status } : {}) },
      select: {
        id: true, userId: true, propertyId: true, teamId: true, tenantId: true,
        scheduledAt: true, estimatedDuration: true, price: true, status: true,
        notes: true, createdAt: true,
        property: { select: { nickname: true, address: true, city: true } },
        team: { select: { name: true, color: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    })
    return ok(bookings)
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}
