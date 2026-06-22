import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug, invalidateTenantCache } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  customDomain: z.string().min(4).max(253).nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { tenantSlug: string } },
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { tenantId?: string; role?: string } | undefined
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user?.tenantId !== tenant.id || user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { customDomain: parsed.data.customDomain ?? null },
  })

  invalidateTenantCache(params.tenantSlug)

  return NextResponse.json({ customDomain: updated.customDomain })
}
