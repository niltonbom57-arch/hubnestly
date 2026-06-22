export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, forbidden, notFound, err, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { addDays } from 'date-fns'

interface Params { params: { tenantId: string } }

const updateSchema = z.object({
  /** Número de dias a partir de HOJE para o trial expirar. null = sem expiração (ilimitado) */
  trialDays:  z.number().int().min(0).max(365).nullable().optional(),
  /** Definir data exata de expiração (ISO string). Sobrescreve trialDays se informado */
  trialEndsAt: z.string().datetime().nullable().optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  plan:   z.enum(['STARTER', 'PRO', 'SCALE']).optional(),
  /** Taxa de plataforma customizada (%) */
  platformFeePercent: z.number().min(0).max(100).optional(),
})

/** PATCH /api/admin/tenants/[tenantId] — ajusta trial, status, plano e taxa */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePlatformAdmin()

    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } })
    if (!tenant) return notFound()

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Dados inválidos", 422)

    const { trialDays, trialEndsAt, status, plan, platformFeePercent } = parsed.data

    // Calcula a nova data de trial
    let newTrialEndsAt: Date | null | undefined = undefined
    if (trialEndsAt !== undefined) {
      newTrialEndsAt = trialEndsAt === null ? null : new Date(trialEndsAt)
    } else if (trialDays !== undefined) {
      newTrialEndsAt = trialDays === null ? null : addDays(new Date(), trialDays)
    }

    const updated = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: {
        ...(newTrialEndsAt !== undefined ? { trialEndsAt: newTrialEndsAt } : {}),
        ...(status ? { status } : {}),
        ...(plan   ? { plan }   : {}),
        ...(platformFeePercent !== undefined ? { platformFeePercent } : {}),
      },
      select: {
        id: true, name: true, slug: true,
        status: true, plan: true,
        trialEndsAt: true, platformFeePercent: true,
        createdAt: true,
        _count: { select: { users: true, bookings: true } },
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) return forbidden()
    return serverError()
  }
}
