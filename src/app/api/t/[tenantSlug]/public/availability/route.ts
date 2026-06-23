import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { getAvailability } from '@/lib/scheduling/get-availability'
import { findTimeBlocksForDate } from '@/lib/repositories/timeblock-repository'
import { prisma } from '@/lib/db/prisma'

// GET /api/t/[tenantSlug]/public/availability?date=YYYY-MM-DD&duration=120
// Returns available time slots for a given date — no auth required
export async function GET(
  req: NextRequest,
  { params }: { params: { tenantSlug: string } },
) {
  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const dateStr  = searchParams.get('date')
  const duration = parseInt(searchParams.get('duration') ?? '120', 10)

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
  }

  // Parse date in Eastern Time
  const dateUtc = new Date(`${dateStr}T00:00:00-04:00`)

  // Block past dates and same-day
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  if (dateUtc < tomorrow) {
    return NextResponse.json({ slots: [] })
  }

  const [teams, blocks] = await Promise.all([
    prisma.team.findMany({
      where:  { tenantId: tenant.id, isActive: true },
      select: { id: true },
    }),
    findTimeBlocksForDate(dateUtc, tenant.id),
  ])

  if (teams.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  const slots = getAvailability({ dateUtc, durationMinutes: duration, teams, existingBlocks: blocks })

  return NextResponse.json({
    slots: slots.map(s => ({
      time:   s.startUtc.toLocaleTimeString('en-US', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York',
      }),
      startUtc: s.startUtc.toISOString(),
      endUtc:   s.endUtc.toISOString(),
      teamId:   s.teamId,
    })),
  })
}
