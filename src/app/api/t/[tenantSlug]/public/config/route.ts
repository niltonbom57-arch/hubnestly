import { NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'

// GET /api/t/[tenantSlug]/public/config
// Returns safe public data about a tenant (pricing, branding) — no auth required
export async function GET(
  _req: Request,
  { params }: { params: { tenantSlug: string } },
) {
  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
  })

  return NextResponse.json({
    name: tenant.name,
    slug: tenant.slug,
    branding: {
      primaryColor: settings?.primaryColor ?? '#0d9488',
      accentColor:  settings?.accentColor  ?? '#f59e0b',
      logoUrl:      settings?.logoUrl       ?? null,
      slogan:       settings?.companySlogan ?? null,
      supportPhone: settings?.supportPhone  ?? null,
      whatsapp:     settings?.whatsappNumber ?? null,
    },
    pricing: {
      basePrice:          Number(settings?.basePrice          ?? 35),
      pricePerBedroom:    Number(settings?.pricePerBedroom    ?? 25),
      pricePerBathroom:   Number(settings?.pricePerBathroom   ?? 20),
      pricePerLivingRoom: Number(settings?.pricePerLivingRoom ?? 15),
      pricePerDiningRoom: Number(settings?.pricePerDiningRoom ?? 12),
      pricePerKitchen:    Number(settings?.pricePerKitchen    ?? 20),
      pricePerOffice:     Number(settings?.pricePerOffice     ?? 15),
      pricePerGarage:     Number(settings?.pricePerGarage     ?? 30),
      priceLaundry:       Number(settings?.priceLaundry       ?? 20),
      pricePool:          Number(settings?.pricePool          ?? 35),
      pricePatio:         Number(settings?.pricePatio         ?? 25),
      priceBalcony:       Number(settings?.priceBalcony       ?? 15),
      priceBasement:      Number(settings?.priceBasement      ?? 30),
      priceGym:           Number(settings?.priceGym           ?? 20),
    },
    // Recurring discounts (flat defaults — can be made configurable later)
    recurringDiscounts: {
      weekly:    10, // 10% off
      biweekly:  8,  // 8% off
      monthly:   5,  // 5% off
    },
    schedule: {
      workDays:       settings?.workDays ?? [1,2,3,4,5,6],
      startHour:      settings?.startHour ?? 8,
      endHour:        settings?.endHour ?? 18,
      minAdvanceHours: settings?.minAdvanceHours ?? 24,
      timezone:       settings?.timezone ?? 'America/New_York',
    },
    cities: settings?.cities ?? [],
  })
}
