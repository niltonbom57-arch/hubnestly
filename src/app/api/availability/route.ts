export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { availabilityQuerySchema } from '@/lib/validation/schemas/booking'
import { getAvailability } from '@/lib/scheduling/get-availability'
import { findTimeBlocksForDate } from '@/lib/repositories/timeblock-repository'
import { prisma } from '@/lib/db/prisma'
import { ok, err, unauthorized, serverError } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {

    const { searchParams } = req.nextUrl
    const parsed = availabilityQuerySchema.safeParse({
      date: searchParams.get('date'),
      duration: searchParams.get('duration'),
    })

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Parâmetros inválidos')
    }

    const { date, duration } = parsed.data
    const dateUtc = new Date(`${date}T00:00:00-04:00`)

    const user = await requireAuth()
    if (!user.tenantId) return err('Tenant inválido', 400)

    const [teams, blocks] = await Promise.all([
      prisma.team.findMany({ where: { tenantId: user.tenantId, isActive: true }, select: { id: true } }),
      findTimeBlocksForDate(dateUtc, user.tenantId),
    ])

    const slots = getAvailability({
      dateUtc,
      durationMinutes: duration,
      teams,
      existingBlocks: blocks,
    })

    return ok(slots.map((s) => ({
      startUtc: s.startUtc.toISOString(),
      endUtc: s.endUtc.toISOString(),
      teamId: s.teamId,
    })))
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}
