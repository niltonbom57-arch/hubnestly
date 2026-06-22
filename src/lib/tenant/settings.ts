import { prisma } from '@/lib/db/prisma'
import type { TenantSettings } from '@prisma/client'

// Cache de settings por tenantId com TTL de 5 minutos
const cache = new Map<string, { settings: TenantSettings; expiresAt: number }>()
const TTL_MS = 5 * 60_000

export function invalidateSettingsCache(tenantId: string): void {
  cache.delete(tenantId)
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const cached = cache.get(tenantId)
  if (cached && Date.now() < cached.expiresAt) return cached.settings

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  if (settings) cache.set(tenantId, { settings, expiresAt: Date.now() + TTL_MS })
  return settings
}

/** Retorna os settings com fallback nos valores padrão (nunca retorna null) */
export async function getTenantSettingsOrDefault(tenantId: string): Promise<TenantSettings> {
  const settings = await getTenantSettings(tenantId)
  if (settings) return settings

  // Retorna defaults inline se settings ainda não foram criados
  return {
    id: '',
    tenantId,
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#0d9488',
    accentColor: '#f59e0b',
    companySlogan: null,
    companyWebsite: null,
    companyAddress: null,
    companyCity: null,
    companyState: null,
    companyZip: null,
    companyEin: null,
    supportEmail: null,
    supportPhone: null,
    whatsappNumber: null,
    cities: [],
    timezone: 'America/New_York',
    workDays: [1, 2, 3, 4, 5, 6],
    startHour: 8,
    endHour: 18,
    minAdvanceHours: 24,
    travelBlockMinutes: 40,
    basePrice: 35 as unknown as TenantSettings['basePrice'],
    pricePerBedroom: 25 as unknown as TenantSettings['pricePerBedroom'],
    pricePerBathroom: 20 as unknown as TenantSettings['pricePerBathroom'],
    pricePerLivingRoom: 15 as unknown as TenantSettings['pricePerLivingRoom'],
    pricePerDiningRoom: 12 as unknown as TenantSettings['pricePerDiningRoom'],
    pricePerKitchen: 20 as unknown as TenantSettings['pricePerKitchen'],
    pricePerOffice: 15 as unknown as TenantSettings['pricePerOffice'],
    pricePerGarage: 30 as unknown as TenantSettings['pricePerGarage'],
    priceLaundry: 20 as unknown as TenantSettings['priceLaundry'],
    pricePool: 35 as unknown as TenantSettings['pricePool'],
    pricePatio: 25 as unknown as TenantSettings['pricePatio'],
    priceBalcony: 15 as unknown as TenantSettings['priceBalcony'],
    priceBasement: 30 as unknown as TenantSettings['priceBasement'],
    priceAttic: 25 as unknown as TenantSettings['priceAttic'],
    priceGym: 20 as unknown as TenantSettings['priceGym'],
    priceGameRoom: 20 as unknown as TenantSettings['priceGameRoom'],
    priceExtraRoom: 15 as unknown as TenantSettings['priceExtraRoom'],
    priceGarage: 30 as unknown as TenantSettings['priceGarage'],
    baseDurationMinutes: 90,
    durationPerBedroom: 30,
    durationPerBathroom: 20,
    durationPerLivingRoom: 15,
    durationPerDiningRoom: 10,
    durationPerKitchen: 20,
    durationPerOffice: 15,
    durationPerGarage: 20,
    // Recurring discounts
    discountWeekly: 10,
    discountBiweekly: 8,
    discountMonthly: 5,
    deepCleaningMultiplier: 135,
    useHoldCapture: false,
    updatedAt: new Date(),
  }
}
