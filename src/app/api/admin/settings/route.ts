export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { ok, err, unauthorized, serverError } from '@/lib/api/response'

const settingsSchema = z.object({
  // Identidade da empresa
  companyName:    z.string().min(2, 'Nome muito curto').max(80),
  companySlogan:  z.string().max(120).optional().nullable(),
  companyWebsite: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  companyAddress: z.string().max(200).optional().nullable(),
  companyCity:    z.string().max(80).optional().nullable(),
  companyState:   z.string().max(50).optional().nullable(),
  companyZip:     z.string().max(20).optional().nullable(),
  companyEin:     z.string().max(30).optional().nullable(),

  // Contato
  supportPhone:   z.string().max(20).optional().nullable(),
  supportEmail:   z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  whatsappNumber: z.string().max(20).optional().nullable(),

  // Cores da marca
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida').optional(),
  accentColor:  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida').optional(),

  // Cidades atendidas
  cities: z.array(z.string().min(2)).min(1, 'Informe ao menos uma cidade'),

  // Horários
  startHour:          z.number().int().min(0).max(23),
  endHour:            z.number().int().min(1).max(24),
  minAdvanceHours:    z.number().int().min(1),
  travelBlockMinutes: z.number().int().min(0),

  // Credenciais de notificação (apenas para uso futuro — nunca salvas no DB)
  resendApiKey:    z.string().optional().nullable(),
  resendFromEmail: z.string().optional().nullable(),
  twilioSid:       z.string().optional().nullable(),
  twilioToken:     z.string().optional().nullable(),
  twilioPhone:     z.string().optional().nullable(),
})

export async function GET() {
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    const [tenant, settings] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { name: true, slug: true },
      }),
      prisma.tenantSettings.findUnique({ where: { tenantId: user.tenantId } }),
    ])

    return ok({ tenant, settings })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    const body: unknown = await req.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const {
      companyName, companySlogan, companyWebsite,
      companyAddress, companyCity, companyState, companyZip, companyEin,
      supportPhone, supportEmail, whatsappNumber,
      primaryColor, accentColor,
      cities, startHour, endHour, minAdvanceHours, travelBlockMinutes,
    } = parsed.data

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data:  { name: companyName },
    })

    const nullIfEmpty = (v?: string | null) => (v && v.trim() ? v.trim() : null)

    await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        primaryColor:   primaryColor ?? '#0d9488',
        accentColor:    accentColor  ?? '#f59e0b',
        companySlogan:  nullIfEmpty(companySlogan),
        companyWebsite: nullIfEmpty(companyWebsite),
        companyAddress: nullIfEmpty(companyAddress),
        companyCity:    nullIfEmpty(companyCity),
        companyState:   nullIfEmpty(companyState),
        companyZip:     nullIfEmpty(companyZip),
        companyEin:     nullIfEmpty(companyEin),
        supportPhone:   nullIfEmpty(supportPhone),
        supportEmail:   nullIfEmpty(supportEmail),
        whatsappNumber: nullIfEmpty(whatsappNumber),
        cities,
        startHour,
        endHour,
        minAdvanceHours,
        travelBlockMinutes,
      },
      update: {
        primaryColor:   primaryColor ?? '#0d9488',
        accentColor:    accentColor  ?? '#f59e0b',
        companySlogan:  nullIfEmpty(companySlogan),
        companyWebsite: nullIfEmpty(companyWebsite),
        companyAddress: nullIfEmpty(companyAddress),
        companyCity:    nullIfEmpty(companyCity),
        companyState:   nullIfEmpty(companyState),
        companyZip:     nullIfEmpty(companyZip),
        companyEin:     nullIfEmpty(companyEin),
        supportPhone:   nullIfEmpty(supportPhone),
        supportEmail:   nullIfEmpty(supportEmail),
        whatsappNumber: nullIfEmpty(whatsappNumber),
        cities,
        startHour,
        endHour,
        minAdvanceHours,
        travelBlockMinutes,
      },
    })

    return ok({ saved: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}
