export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { findPropertyById, deleteProperty } from '@/lib/repositories/property-repository'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await findPropertyById(params.id, session.user.id)
  if (!property) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })

  if (!session.user.tenantId) return NextResponse.json({ error: 'Tenant inválido' }, { status: 400 })
  await deleteProperty(params.id, session.user.tenantId)
  return NextResponse.json({ success: true })
}
