export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import { registerSchema } from '@/lib/validation/schemas/auth'
import { created, err, serverError } from '@/lib/api/response'
import { z } from 'zod'

const registerWithTenantSchema = registerSchema.extend({
  tenantSlug: z.string().min(1, 'Empresa obrigatória'),
})

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = registerWithTenantSchema.safeParse(body)

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { name, email, password, phone, tenantSlug } = parsed.data

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return err('Empresa não encontrada', 404)

    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    })
    if (existing) return err('Este email já está cadastrado', 409)

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: { tenantId: tenant.id, name, email, hashedPassword, phone },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return created(user)
  } catch {
    return serverError()
  }
}
