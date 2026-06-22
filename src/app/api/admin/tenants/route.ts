export const dynamic = 'force-dynamic'

import { requirePlatformAdmin } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, forbidden, serverError } from '@/lib/api/response'

/** GET /api/admin/tenants — lista todas as empresas cadastradas */
export async function GET() {
  try {
    await requirePlatformAdmin()

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        plan: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            bookings: true,
          },
        },
      },
    })

    return ok(tenants)
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}
