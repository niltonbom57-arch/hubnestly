export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { ok, created, forbidden, err as badRequest, serverError } from '@/lib/api/response'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

interface Params { params: { tenantSlug: string } }

// ── GET — listar clientes do tenant ──────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { tenantId?: string; role?: string } | undefined
    const tenant = await resolveTenantBySlug(params.tenantSlug)

    if (!tenant || user?.tenantId !== tenant.id || user?.role !== 'ADMIN') return forbidden()

    const customers = await prisma.user.findMany({
      where: { tenantId: tenant.id, role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        properties: {
          select: {
            id: true,
            nickname: true,
            address: true,
            city: true,
            bedrooms: true,
            bathrooms: true,
            calculatedPrice: true,
            customPrice: true,
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(customers)
  } catch {
    return serverError()
  }
}

// ── POST — cadastrar cliente manualmente ─────────────────────────
const createCustomerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  phone:    z.string().optional(),
  password: z.string().min(6).optional(),

  // Propriedade (opcional, mas recomendado)
  property: z.object({
    nickname:    z.string().min(1, 'Nome do imóvel obrigatório'),
    address:     z.string().min(3, 'Endereço muito curto'),
    city:        z.string().min(2, 'Cidade obrigatória'),
    bedrooms:    z.number().int().min(1).max(20),
    bathrooms:   z.number().int().min(1).max(20),
    customPrice: z.number().min(1, 'Preço mínimo é $1.00').optional(),
  }).optional(),
})

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { tenantId?: string; role?: string } | undefined
    const tenant = await resolveTenantBySlug(params.tenantSlug)

    if (!tenant || sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') return forbidden()

    const body = await req.json()
    const parsed = createCustomerSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Dados inválidos")

    const { name, email, phone, password, property } = parsed.data

    // Verifica email duplicado no tenant
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    })
    if (existing) return badRequest('Este email já está cadastrado nesta empresa.')

    // Preço automático se não informado customPrice
    let calculatedPrice = 150 // fallback
    let customPrice: number | undefined = undefined

    if (property) {
      // Fórmula: 35 + (bed*25) + (bath*20)
      calculatedPrice = 35 + (property.bedrooms * 25) + (property.bathrooms * 20)
      customPrice = property.customPrice
    }

    const tempPassword = randomBytes(8).toString('hex')
    const hashedPassword = await bcrypt.hash(password ?? tempPassword, 10)

    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        phone,
        hashedPassword,
        role: 'CLIENT',
        ...(property ? {
          properties: {
            create: {
              tenantId: tenant.id,
              nickname:        property.nickname,
              address:         property.address,
              city:            property.city,
              bedrooms:        property.bedrooms,
              bathrooms:       property.bathrooms,
              calculatedPrice,
              ...(customPrice !== undefined ? { customPrice } : {}),
            },
          },
        } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        properties: {
          select: { id: true, nickname: true, calculatedPrice: true, customPrice: true },
        },
      },
    })

    return created(newUser)
  } catch {
    return serverError()
  }
}
