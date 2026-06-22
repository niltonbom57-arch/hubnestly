import { prisma } from '@/lib/db/prisma'

export async function findAddOnsByTenant(tenantId: string) {
  return prisma.addOn.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function findAddOnsByIds(ids: string[], tenantId: string) {
  return prisma.addOn.findMany({
    where: { id: { in: ids }, tenantId, isActive: true },
  })
}
