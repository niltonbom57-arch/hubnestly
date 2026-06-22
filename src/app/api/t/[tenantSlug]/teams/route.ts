export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { ok, created, forbidden, err as badRequest, serverError } from '@/lib/api/response'
import { z } from 'zod'

interface Params { params: { tenantSlug: string } }

// ── GET — listar equipes do tenant com contagem de bookings do mês ────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { tenantId?: string; role?: string } | undefined
    const tenant = await resolveTenantBySlug(params.tenantSlug)

    if (!tenant || user?.tenantId !== tenant.id || user?.role !== 'ADMIN') return forbidden()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const teams = await prisma.team.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: { select: { bookings: true } },
        bookings: {
          where: {
            scheduledAt: { gte: startOfMonth, lte: endOfMonth },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const result = teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      isActive: team.isActive,
      createdAt: team.createdAt,
      totalBookings: team._count.bookings,
      bookingsThisMonth: team.bookings.length,
    }))

    return ok(result)
  } catch {
    return serverError()
  }
}

// ── POST — criar equipe ───────────────────────────────────────────────────────
const createTeamSchema = z.object({
  name:  z.string().min(1, 'Nome obrigatório').max(50, 'Nome muito longo'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida — use formato hex #RRGGBB')
    .default('#3B82F6'),
})

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { tenantId?: string; role?: string } | undefined
    const tenant = await resolveTenantBySlug(params.tenantSlug)

    if (!tenant || user?.tenantId !== tenant.id || user?.role !== 'ADMIN') return forbidden()

    const body: unknown = await req.json()
    const parsed = createTeamSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')

    const { name, color } = parsed.data

    const team = await prisma.team.create({
      data: { tenantId: tenant.id, name, color, isActive: true },
    })

    return created({
      id: team.id,
      name: team.name,
      color: team.color,
      isActive: team.isActive,
      createdAt: team.createdAt,
      totalBookings: 0,
      bookingsThisMonth: 0,
    })
  } catch {
    return serverError()
  }
}
