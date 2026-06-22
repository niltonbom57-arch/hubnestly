import { prisma } from '@/lib/db/prisma'
import { PropertyInput } from '@/lib/validation/schemas/property'
import { calculatePrice } from '@/lib/pricing/calculate-price'

const propertySelect = {
  id: true,
  userId: true,
  nickname: true,
  address: true,
  city: true,
  // Cômodos com quantidade
  bedrooms: true,
  bathrooms: true,
  livingRooms: true,
  diningRooms: true,
  kitchens: true,
  offices: true,
  garages: true,
  // Áreas extras
  hasLaundry: true,
  hasPool: true,
  hasPatio: true,
  hasBalcony: true,
  hasBasement: true,
  hasAttic: true,
  hasGym: true,
  hasGameRoom: true,
  // Legado
  extraRooms: true,
  hasGarage: true,
  // Tipo de imóvel e acesso
  propertyType: true,
  accessType: true,
  accessCode: true,
  accessNotes: true,
  cleaningNotes: true,
  cleaningAreas: true,
  calculatedPrice: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function findPropertiesByUser(userId: string, tenantId?: string) {
  return prisma.property.findMany({
    where: { userId, ...(tenantId ? { tenantId } : {}) },
    select: propertySelect,
    orderBy: { createdAt: 'desc' },
  })
}

export async function findPropertyById(id: string, userId?: string, tenantId?: string) {
  return prisma.property.findFirst({
    where: { id, ...(userId ? { userId } : {}), ...(tenantId ? { tenantId } : {}) },
    select: propertySelect,
  })
}

export async function createProperty(userId: string, data: PropertyInput, tenantId: string) {
  const { total } = calculatePrice(data)

  return prisma.property.create({
    data: {
      ...data,
      userId,
      tenantId,
      calculatedPrice: total,
    },
    select: propertySelect,
  })
}

export async function updateProperty(id: string, data: PropertyInput, tenantId: string) {
  const { total } = calculatePrice(data)

  // findFirst garante que a propriedade pertence ao tenant antes de atualizar
  const prop = await prisma.property.findFirst({ where: { id, tenantId }, select: { id: true } })
  if (!prop) throw new Error('NOT_FOUND')

  return prisma.property.update({
    where: { id },
    data: { ...data, calculatedPrice: total },
    select: propertySelect,
  })
}

export async function deleteProperty(id: string, tenantId: string) {
  // findFirst garante que a propriedade pertence ao tenant antes de deletar
  const prop = await prisma.property.findFirst({ where: { id, tenantId }, select: { id: true } })
  if (!prop) throw new Error('NOT_FOUND')

  return prisma.property.delete({ where: { id } })
}
