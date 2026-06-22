export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ok, created, err, serverError } from '@/lib/api/response'
import { onboardingSchema } from '@/lib/validation/schemas/onboarding'
import { hashPassword } from '@/lib/auth/password'
import { addDays } from 'date-fns'

/** GET /api/onboarding?slug=xxx — verifica se o slug está disponível */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return err('Slug não informado', 400)

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  return ok({ available: !existing })
}

/** POST /api/onboarding — cria tenant + admin + settings (trial 14 dias) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Dados inválidos', 422)

    const { companyName, slug, adminName, adminEmail, adminPassword, cities, timezone } =
      parsed.data

    // Verifica slug único
    const slugExists = await prisma.tenant.findUnique({ where: { slug } })
    if (slugExists) return err('Este endereço já está em uso', 409)

    const hashedPassword = await hashPassword(adminPassword)
    const trialEndsAt = addDays(new Date(), 14)

    // Cria tudo atomicamente
    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug,
          name: companyName,
          status: 'TRIAL',
          plan: 'STARTER',
          trialEndsAt,
        },
      })

      await tx.tenantSettings.create({
        data: {
          tenantId: newTenant.id,
          cities,
          timezone,
        },
      })

      await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: adminName,
          email: adminEmail,
          hashedPassword,
          role: 'ADMIN',
        },
      })

      return newTenant
    })

    return created({
      tenantId: tenant.id,
      slug: tenant.slug,
      dashboardUrl: `/t/${tenant.slug}/admin`,
      trialEndsAt: tenant.trialEndsAt,
    })
  } catch {
    return serverError()
  }
}
