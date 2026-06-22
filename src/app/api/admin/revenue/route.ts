export const dynamic = 'force-dynamic'

import { requirePlatformAdmin } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, forbidden, serverError } from '@/lib/api/response'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET() {
  try {
    await requirePlatformAdmin()

    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i)
      return { start: startOfMonth(date), end: endOfMonth(date), label: date.toISOString().slice(0, 7) }
    })

    const data = await Promise.all(
      months.map(async ({ start, end, label }) => {
        const result = await prisma.booking.aggregate({
          _sum: { price: true },
          _count: { id: true },
          where: {
            status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
            scheduledAt: { gte: start, lte: end },
          },
        })
        return {
          month: label,
          revenue: Number(result._sum.price ?? 0),
          bookings: result._count.id,
        }
      }),
    )

    const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0)
    const avgMonthly = totalRevenue / data.length
    const projected = Math.round(avgMonthly * 12)

    return ok({ monthly: data, totalRevenue, projected })
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}
