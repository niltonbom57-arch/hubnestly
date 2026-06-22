export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { ok, created, err, forbidden, serverError } from '@/lib/api/response'

const teamSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
})

export async function GET() {
  try {
    const user = await requireAdmin()
    const teams = await prisma.team.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'asc' },
    })
    return ok(teams)
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin()
    const body: unknown = await req.json()
    const parsed = teamSchema.safeParse(body)

    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Dados inválidos')

    const team = await prisma.team.create({
      data: { ...parsed.data, tenantId: user.tenantId },
    })
    return created(team)
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}
