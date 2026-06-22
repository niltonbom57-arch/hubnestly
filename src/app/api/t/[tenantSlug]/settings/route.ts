export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { invalidateSettingsCache } from '@/lib/tenant/settings'
import { ok, err, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const settingsSchema = z.object({
  // Branding
  logoUrl:      z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida').optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().optional(),
  // Operação
  cities:            z.array(z.string()).min(1).optional(),
  timezone:          z.string().optional(),
  workDays:          z.array(z.number().int().min(0).max(6)).optional(),
  startHour:         z.number().int().min(0).max(23).optional(),
  endHour:           z.number().int().min(1).max(24).optional(),
  minAdvanceHours:   z.number().int().min(0).optional(),
  travelBlockMinutes:z.number().int().min(0).optional(),
  // Preços
  basePrice:        z.number().min(0).optional(),
  pricePerBedroom:  z.number().min(0).optional(),
  pricePerBathroom: z.number().min(0).optional(),
  priceLaundry:     z.number().min(0).optional(),
  priceExtraRoom:   z.number().min(0).optional(),
  priceGarage:      z.number().min(0).optional(),
  pricePool:        z.number().min(0).optional(),
  pricePatio:       z.number().min(0).optional(),
  // Duração
  baseDurationMinutes: z.number().int().min(0).optional(),
  durationPerBedroom:  z.number().int().min(0).optional(),
  durationPerBathroom: z.number().int().min(0).optional(),
})

async function resolveAndAuthorize(params: { tenantSlug: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: unauthorized() }

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) return { error: notFound('Empresa não encontrada') }

  const user = session.user as { tenantId?: string; role?: string; isPlatformAdmin?: boolean }
  const isOwner = user.tenantId === tenant.id
  const isAdmin = user.role === 'ADMIN' || user.isPlatformAdmin

  if (!isOwner || !isAdmin) return { error: forbidden() }

  return { tenant }
}

export async function GET(_req: NextRequest, { params }: { params: { tenantSlug: string } }) {
  const auth = await resolveAndAuthorize(params)
  if (auth.error) return auth.error

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: auth.tenant!.id },
  })
  return ok(settings)
}

export async function PATCH(req: NextRequest, { params }: { params: { tenantSlug: string } }) {
  try {
    const auth = await resolveAndAuthorize(params)
    if (auth.error) return auth.error

    const body = await req.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Dados inválidos', 422)

    const settings = await prisma.tenantSettings.upsert({
      where:  { tenantId: auth.tenant!.id },
      create: { tenantId: auth.tenant!.id, ...parsed.data },
      update: parsed.data,
    })

    invalidateSettingsCache(auth.tenant!.id)
    return ok(settings)
  } catch {
    return serverError()
  }
}
