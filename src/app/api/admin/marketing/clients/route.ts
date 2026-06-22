export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    const clients = await prisma.user.findMany({
      where: { tenantId: user.tenantId, role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] } },
          select: { price: true, scheduledAt: true },
          orderBy: { scheduledAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      bookingCount: c.bookings.length,
      lastBookingAt: c.bookings[0]?.scheduledAt ?? null,
      totalSpent: c.bookings.reduce((sum, b) => sum + Number(b.price), 0),
    }))

    return ok(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return unauthorized()
    console.error('[GET /api/admin/marketing/clients]', error)
    return serverError()
  }
}
