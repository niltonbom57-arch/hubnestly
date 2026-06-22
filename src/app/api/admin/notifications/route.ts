export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    const notifications = await prisma.notification.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        booking: {
          select: { id: true },
        },
      },
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return ok({ notifications, unreadCount })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}

export async function PATCH() {
  // Marca todas como lidas
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    await prisma.notification.updateMany({
      where: { tenantId: user.tenantId, read: false },
      data: { read: true },
    })

    return ok({ marked: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}
