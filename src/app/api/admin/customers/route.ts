export const dynamic = 'force-dynamic'

import { requirePlatformAdmin } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, forbidden, serverError } from '@/lib/api/response'

export async function GET() {
  try {
    await requirePlatformAdmin()

    const customers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(customers)
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}
