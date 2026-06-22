import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { findBookingById, cancelBooking } from '@/lib/repositories/booking-repository'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const booking = await findBookingById(params.id, session.user.id, session.user.tenantId as string | undefined)
  if (!booking) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  const cancellable = ['PENDING', 'CONFIRMED', 'PAID']
  if (!cancellable.includes(booking.status)) {
    return NextResponse.json({ error: 'Este agendamento não pode ser cancelado' }, { status: 400 })
  }

  if (!session.user.tenantId) return NextResponse.json({ error: 'Tenant inválido' }, { status: 400 })
  const updated = await cancelBooking(params.id, session.user.tenantId)
  return NextResponse.json({ success: true, booking: updated })
}
