export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { propertySchema } from '@/lib/validation/schemas/property'
import { findPropertiesByUser, createProperty } from '@/lib/repositories/property-repository'
import { ok, created, err, unauthorized, serverError } from '@/lib/api/response'

export async function GET() {
  try {
    const user = await requireAuth()
    const properties = await findPropertiesByUser(user.id)
    return ok(properties)
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body: unknown = await req.json()
    const parsed = propertySchema.safeParse(body)

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    if (!user.tenantId) return err('Tenant inválido', 400)
    const property = await createProperty(user.id, parsed.data, user.tenantId)
    return created(property)
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    return serverError()
  }
}
