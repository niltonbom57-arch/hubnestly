export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { ok, forbidden, notFound, err as badRequest, serverError } from '@/lib/api/response'
import { z } from 'zod'

interface Params { params: { tenantSlug: string; teamId: string } }

// ── PATCH — editar nome, cor ou isActive ──────────────────────────────────────
const updateTeamSchema = z.object({
  name:     z.string().min(1, 'Nome obrigatório').max(50, 'Nome muito longo').optional(),
  color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { tenantId?: string; role?: string } | undefined
    const tenant = await resolveTenantBySlug(params.tenantSlug)

    if (!tenant || user?.tenantId !== tenant.id || user?.role !== 'ADMIN') return forbidden()

    // Verificar que a equipe pertence ao tenant
    const existing = await prisma.team.findFirst({
      where: { id: params.teamId, tenantId: tenant.id },
    })
    if (!existing) return notFound('Equipe')

    const body: unknown = await req.json()
    const parsed = updateTeamSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')

    const { name, color, isActive } = parsed.data

    if (name === undefined && color === undefined && isActive === undefined) {
      return badRequest('Nenhum campo para atualizar')
    }

    const updated = await prisma.team.update({
      where: { id: params.teamId },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return ok({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    })
  } catch {
    return serverError()
  }
}
