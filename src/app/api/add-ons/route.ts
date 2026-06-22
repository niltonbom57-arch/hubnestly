export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { findAddOnsByTenant } from '@/lib/repositories/addon-repository'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Busca tenantId do usuário
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const addOns = await findAddOnsByTenant(user.tenantId)
  return NextResponse.json({ addOns })
}
