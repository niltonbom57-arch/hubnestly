export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { ok, forbidden, err as badRequest, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

interface Params { params: { tenantSlug: string; customerId: string } }

// ── PATCH — atualizar dados e/ou preço personalizado de propriedade ─
const updateSchema = z.object({
  name:  z.string().min(2).optional(),
  phone: z.string().optional(),

  // Atualizar preço de uma propriedade específica
  propertyId:  z.string().optional(),
  customPrice: z.number().min(1, 'Preço mínimo é $1.00').nullable().optional(), // null = remover preço customizado
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { tenantId?: string; role?: string } | undefined
    const tenant = await resolveTenantBySlug(params.tenantSlug)

    if (!tenant || sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') return forbidden()

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Dados inválidos")

    const { name, phone, propertyId, customPrice } = parsed.data

    // Verifica que o cliente pertence ao tenant
    const customer = await prisma.user.findFirst({
      where: { id: params.customerId, tenantId: tenant.id, role: 'CLIENT' },
    })
    if (!customer) return notFound()

    // Atualiza dados pessoais se fornecidos
    if (name || phone !== undefined) {
      await prisma.user.update({
        where: { id: params.customerId },
        data: {
          ...(name  ? { name }  : {}),
          ...(phone !== undefined ? { phone } : {}),
        },
      })
    }

    // Atualiza preço da propriedade se fornecido
    if (propertyId && customPrice !== undefined) {
      // Verifica que a propriedade pertence ao cliente e ao tenant
      const property = await prisma.property.findFirst({
        where: { id: propertyId, userId: params.customerId, tenantId: tenant.id },
      })
      if (!property) return notFound()

      await prisma.property.update({
        where: { id: propertyId },
        data: { customPrice: customPrice === null ? null : customPrice },
      })
    }

    // Retorna cliente atualizado
    const updated = await prisma.user.findFirst({
      where: { id: params.customerId, tenantId: tenant.id },
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        properties: {
          select: {
            id: true, nickname: true, address: true, city: true,
            bedrooms: true, bathrooms: true,
            calculatedPrice: true, customPrice: true,
          },
        },
        _count: { select: { bookings: true } },
      },
    })

    return ok(updated)
  } catch {
    return serverError()
  }
}
