export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { findBookingById } from '@/lib/repositories/booking-repository'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const booking = await findBookingById(params.id, session.user.id, session.user.tenantId as string | undefined)
  if (!booking) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({ booking })
}
